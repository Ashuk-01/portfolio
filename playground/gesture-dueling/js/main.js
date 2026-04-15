/* ============================================
   MAIN — Entry Point
   Wire everything together
   ============================================ */

(async function () {
  // Initialize
  UI.init();
  Renderer.init();

  // ---- BUTTON HANDLERS ----
  document.getElementById('btn-start').addEventListener('click', () => {
    GameEngine.startGame();
  });

  document.getElementById('btn-howto').addEventListener('click', () => {
    GameEngine.setState(GameEngine.STATES.HOWTO);
  });

  document.getElementById('btn-howto-back').addEventListener('click', () => {
    GameEngine.setState(GameEngine.STATES.MENU);
  });

  document.getElementById('btn-fight').addEventListener('click', () => {
    GameEngine.startBattle();
  });

  document.getElementById('btn-playagain').addEventListener('click', () => {
    GameEngine.startGame();
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    GameEngine.setState(GameEngine.STATES.MENU);
  });

  // ---- HAND TRACKING ----
  let handDetected = false;
  let currentLandmarks = null;

  function onHandResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      handDetected = true;
      currentLandmarks = results.multiHandLandmarks[0];

      // During calibration — show debug info
      if (GameEngine.getState() === GameEngine.STATES.CALIBRATE) {
        UI.updateCalibration(true);
        const testGesture = GestureRecognition.classifyGesture(currentLandmarks);
        const debug = GestureRecognition.getDebugInfo();
        const spell = GameEngine.SPELL_NAMES[testGesture] || testGesture;
        document.getElementById('debug-info').textContent = `${debug} → ${spell}`;
      }

      // During casting
      if (GameEngine.getState() === GameEngine.STATES.CASTING) {
        const gestureResult = GestureRecognition.update(currentLandmarks);

        if (gestureResult.lockedSpell) {
          // Already locked
          UI.setSpellIndicator('player', gestureResult.lockedSpell, 1);
        } else if (gestureResult.isStable) {
          // Lock it in and resolve immediately
          const locked = GestureRecognition.lockSpell();
          if (locked) {
            GameEngine.setPlayerSpell(locked);
            UI.setSpellIndicator('player', locked, 1);
            Sound.spellLocked();
            // Cancel the timer and resolve now
            if (countdownTimer) {
              clearTimeout(countdownTimer);
              countdownTimer = null;
            }
            GameEngine.resolveRound();
          }
        } else if (gestureResult.currentGesture !== 'none') {
          // Show progress
          UI.setSpellIndicator('player', gestureResult.currentGesture, gestureResult.progress);
        } else {
          UI.setSpellIndicator('player', null);
        }
      }
    } else {
      handDetected = false;
      currentLandmarks = null;
      if (GameEngine.getState() === GameEngine.STATES.CALIBRATE) {
        UI.updateCalibration(false);
      }
    }
  }

  // ---- PAUSE (testing only) ----
  let paused = false;
  let countdownTimer = null;

  document.getElementById('btn-pause').addEventListener('click', () => {
    paused = !paused;
    document.getElementById('btn-pause').textContent = paused ? 'RESUME' : 'PAUSE';

    if (paused) {
      // Stop all timers and hand tracking
      if (countdownTimer) {
        clearTimeout(countdownTimer);
        countdownTimer = null;
      }
      HandTracking.pause();
    } else {
      // Resume hand tracking
      const battleVideo = document.getElementById('battle-video');
      const battleCanvas = document.getElementById('battle-canvas');
      HandTracking.attachTo(battleVideo, battleCanvas);

      // Re-enter current state to restart its timers
      const state = GameEngine.getState();
      if (state === GameEngine.STATES.READY) {
        GameEngine.startCountdown();
      } else if (state === GameEngine.STATES.COUNTDOWN) {
        GameEngine.startCountdown();
      } else if (state === GameEngine.STATES.CASTING) {
        GameEngine.startCasting();
      }
    }
  });

  // ---- GAME STATE HANDLER ----
  let cameraInitialized = false;

  GameEngine.init(async (state, data) => {
    // Clear any running timers
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }

    switch (state) {
      case GameEngine.STATES.MENU:
        UI.showScreen('title');
        HandTracking.stop();
        cameraInitialized = false;
        break;

      case GameEngine.STATES.HOWTO:
        UI.showScreen('howto');
        break;

      case GameEngine.STATES.CALIBRATE:
        UI.showScreen('calibrate');

        // Initialize camera once — this is the only time we ask for permission
        if (!cameraInitialized) {
          await HandTracking.init(onHandResults);
          cameraInitialized = true;
        }

        const calVideo = document.getElementById('calibrate-video');
        const calCanvas = document.getElementById('calibrate-canvas');
        HandTracking.attachTo(calVideo, calCanvas);
        break;

      case GameEngine.STATES.READY:
        UI.showScreen('battle');
        UI.clearBattleUI();
        UI.updateHealth(GameEngine.getPlayerHP(), GameEngine.getWizardHP());
        UI.updateRound(GameEngine.getRound());
        Renderer.clearParticles();

        // Just switch the video/canvas — no new camera request
        const battleVideo = document.getElementById('battle-video');
        const battleCanvas = document.getElementById('battle-canvas');
        HandTracking.attachTo(battleVideo, battleCanvas);

        // Start countdown immediately
        if (!paused) {
          GameEngine.startCountdown();
        }
        break;

      case GameEngine.STATES.COUNTDOWN:
        UI.setCountdown('3', false);
        Sound.countdownTick();
        Renderer.setWizardState('charging');

        if (!paused) {
          countdownTimer = setTimeout(() => {
            UI.setCountdown('2', false);
            Sound.countdownTick();
            countdownTimer = setTimeout(() => {
              UI.setCountdown('1', false);
              Sound.countdownTick();
              countdownTimer = setTimeout(() => {
                GameEngine.startCasting();
              }, 1000);
            }, 1000);
          }, 1000);
        }
        break;

      case GameEngine.STATES.CASTING:
        UI.setCountdown('CAST!', true);
        Sound.castAlert();
        UI.setSpellIndicator('wizard', null);
        UI.setSpellIndicator('player', null);
        GestureRecognition.reset();

        // 1 second casting window
        if (!paused) {
          countdownTimer = setTimeout(() => {
            GameEngine.resolveRound();
          }, 1000);
        }
        break;

      case GameEngine.STATES.RESOLVE:
        // Brief pause — both spells hidden — builds tension
        UI.setCountdown('...', false);
        UI.setSpellIndicator('player', null);
        UI.setSpellIndicator('wizard', null);
        Renderer.setWizardState('cast');

        // Reveal both spells at the same time
        setTimeout(() => {
          UI.setCountdown('', false);
          UI.setSpellIndicator('player', data.playerSpell, 1);
          UI.setSpellIndicator('wizard', data.wizardSpell, 1);
          Sound.spellReveal();

          // Spawn spell effects simultaneously
          Renderer.spawnSpellEffect(data.playerSpell, 'right');
          Renderer.spawnSpellEffect(data.wizardSpell, 'left');

          // Clash + results after a beat
          setTimeout(() => {
            Renderer.spawnClashEffect();
            Sound.clash();

            UI.showClashResult(data.message);
            UI.updateHealth(data.playerHP, data.wizardHP);

            if (data.playerDmg > 0) {
              Renderer.spawnDamageNumber(data.playerDmg, 'right', false);
              UI.screenShake();
              Sound.damage();
            }
            if (data.wizardDmg > 0) {
              Renderer.spawnDamageNumber(data.wizardDmg, 'left', false);
              Renderer.setWizardState('hit');
              Sound.damage();
            }
            if (data.playerHealed) {
              Renderer.spawnDamageNumber(15, 'right', true);
              Sound.heal();
            }
            if (data.wizardHealed) {
              Renderer.spawnDamageNumber(15, 'left', true);
              Sound.heal();
            }
          }, 400);
        }, 400);
        break;

      case GameEngine.STATES.GAMEOVER:
        UI.showGameOver(data);
        UI.showScreen('gameover');
        HandTracking.pause();

        if (data.winner === 'player') {
          Renderer.setWizardState('hit');
          Sound.win();
        } else {
          Renderer.setWizardState('victory');
          Sound.lose();
        }
        break;
    }
  });
})();
