/* ============================================
   UI CONTROLLER
   Screen transitions, health bars, countdown
   ============================================ */

const UI = (() => {
  const screens = {};
  const elements = {};

  function init() {
    screens.title = document.getElementById('screen-title');
    screens.howto = document.getElementById('screen-howto');
    screens.calibrate = document.getElementById('screen-calibrate');
    screens.battle = document.getElementById('screen-battle');
    screens.gameover = document.getElementById('screen-gameover');

    elements.calibrateStatus = document.getElementById('calibrate-status');
    elements.btnFight = document.getElementById('btn-fight');
    elements.wizardHealthFill = document.getElementById('wizard-health-fill');
    elements.playerHealthFill = document.getElementById('player-health-fill');
    elements.wizardHealthText = document.getElementById('wizard-health-text');
    elements.playerHealthText = document.getElementById('player-health-text');
    elements.wizardSpell = document.getElementById('wizard-spell-indicator');
    elements.playerSpell = document.getElementById('player-spell-indicator');
    elements.countdown = document.getElementById('countdown');
    elements.roundCounter = document.getElementById('round-counter');
    elements.clashResult = document.getElementById('clash-result');
    elements.gameoverTitle = document.getElementById('gameover-title');
    elements.gameoverSubtitle = document.getElementById('gameover-subtitle');
    elements.gameoverStats = document.getElementById('gameover-stats');
  }

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (screens[name]) {
      screens[name].classList.add('active');
    }
  }

  function updateCalibration(detected) {
    if (detected) {
      elements.calibrateStatus.textContent = 'Hand detected!';
      elements.calibrateStatus.classList.add('detected');
      elements.btnFight.disabled = false;
    } else {
      elements.calibrateStatus.textContent = 'Waiting for hand...';
      elements.calibrateStatus.classList.remove('detected');
      elements.btnFight.disabled = true;
    }
  }

  function updateHealth(playerHP, wizardHP) {
    elements.playerHealthFill.style.width = `${playerHP}%`;
    elements.wizardHealthFill.style.width = `${wizardHP}%`;
    elements.playerHealthText.textContent = `${playerHP} HP`;
    elements.wizardHealthText.textContent = `${wizardHP} HP`;

    // Gold for player, red when low
    if (playerHP <= 30) {
      elements.playerHealthFill.style.background = 'linear-gradient(180deg, #ff4444 0%, #cc1111 100%)';
    } else {
      elements.playerHealthFill.style.background = 'linear-gradient(180deg, #f0b040 0%, #d08820 100%)';
    }

    // Purple for wizard, red when low
    if (wizardHP <= 30) {
      elements.wizardHealthFill.style.background = 'linear-gradient(180deg, #ff4444 0%, #cc1111 100%)';
    } else {
      elements.wizardHealthFill.style.background = 'linear-gradient(180deg, #9b6cf6 0%, #7b4cd6 100%)';
    }
  }

  function updateRound(round) {
    elements.roundCounter.textContent = `ROUND ${round}`;
  }

  function setCountdown(text, isCast) {
    elements.countdown.textContent = text;
    if (isCast) {
      elements.countdown.classList.add('cast');
    } else {
      elements.countdown.classList.remove('cast');
    }
  }

  function setSpellIndicator(side, spell, progress) {
    const el = side === 'wizard' ? elements.wizardSpell : elements.playerSpell;

    if (!spell || spell === 'none') {
      el.textContent = '???';
      el.style.color = 'var(--text-secondary)';
      el.style.borderColor = 'var(--border-pixel)';
      return;
    }

    const emoji = GameEngine.SPELL_EMOJIS[spell] || '';
    const name = GameEngine.SPELL_NAMES[spell] || '';

    if (progress !== undefined && progress < 1) {
      const pct = Math.round(progress * 100);
      el.textContent = `${emoji} ${pct}%`;
      el.style.color = 'var(--text-secondary)';
    } else {
      el.textContent = `${emoji} ${name}`;
      el.style.color = getSpellColor(spell);
      el.style.borderColor = getSpellColor(spell);
    }
  }

  function getSpellColor(spell) {
    const colors = {
      fire: 'var(--fire)',
      shield: 'var(--shield)',
      lightning: 'var(--lightning)',
      heal: 'var(--heal)'
    };
    return colors[spell] || 'var(--text-secondary)';
  }

  function showClashResult(message) {
    elements.clashResult.textContent = message;
  }

  function clearBattleUI() {
    elements.countdown.textContent = '';
    elements.countdown.classList.remove('cast');
    elements.clashResult.textContent = '';
    setSpellIndicator('wizard', null);
    setSpellIndicator('player', null);
  }

  function showGameOver(data) {
    const isWin = data.winner === 'player';

    elements.gameoverTitle.textContent = isWin ? 'YOU WIN!' : 'YOU LOSE!';
    elements.gameoverTitle.className = isWin ? 'win' : 'lose';
    elements.gameoverSubtitle.textContent = isWin
      ? 'The wizard has been defeated!'
      : 'The wizard was too powerful...';
    elements.gameoverStats.innerHTML = `
      Rounds: ${data.rounds}<br>
      Your HP: ${data.playerHP}<br>
      Wizard HP: ${data.wizardHP}
    `;
  }

  function screenShake() {
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 300);
  }

  return {
    init, showScreen, updateCalibration, updateHealth,
    updateRound, setCountdown, setSpellIndicator,
    showClashResult, clearBattleUI, showGameOver, screenShake
  };
})();
