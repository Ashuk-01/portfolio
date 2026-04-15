/* ============================================
   GAME ENGINE
   State machine, rounds, health, AI
   ============================================ */

const GameEngine = (() => {
  const STATES = {
    MENU: 'menu',
    HOWTO: 'howto',
    CALIBRATE: 'calibrate',
    READY: 'ready',
    COUNTDOWN: 'countdown',
    CASTING: 'casting',
    RESOLVE: 'resolve',
    GAMEOVER: 'gameover'
  };

  const SPELL_NAMES = {
    fire: 'ROCK',
    shield: 'PAPER',
    lightning: 'SCISSORS',
    heal: 'HEAL',
    none: 'FIZZLE'
  };

  const SPELL_EMOJIS = {
    fire: '✊',
    shield: '🖐',
    lightning: '✌️',
    heal: '💚',
    none: '💨'
  };

  // Spell resolution: result[attacker][defender] = { attackerDmg, defenderDmg, msg }
  const RESOLUTION = {
    fire: {
      fire:      { aDmg: 0, dDmg: 0, msg: 'Rock vs Rock! Stalemate!' },
      shield:    { aDmg: 20, dDmg: 0, msg: 'Paper covers Rock!' },
      lightning: { aDmg: 0, dDmg: 20, msg: 'Rock smashes Scissors!' },
      heal:      { aDmg: 0, dDmg: 25, msg: 'Rock crushes the heal!' },
      none:      { aDmg: 0, dDmg: 20, msg: 'Rock hits the fizzle!' }
    },
    shield: {
      fire:      { aDmg: 0, dDmg: 20, msg: 'Paper covers Rock!' },
      shield:    { aDmg: 0, dDmg: 0, msg: 'Paper vs Paper! Nothing happens.' },
      lightning: { aDmg: 20, dDmg: 0, msg: 'Scissors cuts Paper!' },
      heal:      { aDmg: 0, dDmg: 0, msg: 'Paper vs Heal. Safe heal.', healD: true },
      none:      { aDmg: 0, dDmg: 0, msg: 'Paper stands firm!' }
    },
    lightning: {
      fire:      { aDmg: 20, dDmg: 0, msg: 'Rock smashes Scissors!' },
      shield:    { aDmg: 0, dDmg: 20, msg: 'Scissors cuts Paper!' },
      lightning: { aDmg: 0, dDmg: 0, msg: 'Scissors vs Scissors! Draw!' },
      heal:      { aDmg: 0, dDmg: 25, msg: 'Scissors cuts the heal!' },
      none:      { aDmg: 0, dDmg: 20, msg: 'Scissors cuts the fizzle!' }
    },
    heal: {
      fire:      { aDmg: 25, dDmg: 0, msg: 'Rock crushes the heal!' },
      shield:    { aDmg: 0, dDmg: 0, msg: 'Heal vs Paper. Safe heal.', healA: true },
      lightning: { aDmg: 25, dDmg: 0, msg: 'Scissors cuts the heal!' },
      heal:      { aDmg: 0, dDmg: 0, msg: 'Both heal!', healA: true, healD: true },
      none:      { aDmg: 0, dDmg: 0, msg: 'Free heal!', healA: true }
    },
    none: {
      fire:      { aDmg: 20, dDmg: 0, msg: 'Rock hits the fizzle!' },
      shield:    { aDmg: 0, dDmg: 0, msg: 'Paper stands firm!' },
      lightning: { aDmg: 20, dDmg: 0, msg: 'Scissors cuts the fizzle!' },
      heal:      { aDmg: 0, dDmg: 0, msg: 'Free heal!', healD: true },
      none:      { aDmg: 0, dDmg: 0, msg: 'Both fizzle! Awkward...' }
    }
  };

  const HEAL_AMOUNT = 15;
  const MAX_HP = 100;

  let state = STATES.MENU;
  let playerHP = MAX_HP;
  let wizardHP = MAX_HP;
  let round = 1;
  let playerSpell = null;
  let wizardSpell = null;
  let onStateChange = null;

  function init(stateCallback) {
    onStateChange = stateCallback;
    setState(STATES.MENU);
  }

  function setState(newState, data = {}) {
    state = newState;
    if (onStateChange) {
      onStateChange(state, data);
    }
  }

  function getState() { return state; }
  function getPlayerHP() { return playerHP; }
  function getWizardHP() { return wizardHP; }
  function getRound() { return round; }

  function startGame() {
    playerHP = MAX_HP;
    wizardHP = MAX_HP;
    round = 1;
    playerSpell = null;
    wizardSpell = null;
    setState(STATES.CALIBRATE);
  }

  function startBattle() {
    setState(STATES.READY);
  }

  function startCountdown() {
    setState(STATES.COUNTDOWN);
  }

  function startCasting() {
    playerSpell = null;
    wizardSpell = null;
    GestureRecognition.reset();
    setState(STATES.CASTING);
  }

  function setPlayerSpell(spell) {
    playerSpell = spell;
  }

  function aiPickSpell() {
    // Simple AI: weighted random with some strategy
    const spells = ['fire', 'shield', 'lightning', 'heal'];
    const weights = [30, 30, 30, 10]; // Heal is less likely

    // If AI is low health, increase heal chance
    if (wizardHP <= 30) {
      weights[3] = 25; // More likely to heal
      weights[0] = 25;
      weights[1] = 25;
      weights[2] = 25;
    }

    // If player healed last round, AI is more likely to attack
    if (playerSpell === 'heal') {
      weights[0] = 35;
      weights[2] = 35;
      weights[1] = 20;
      weights[3] = 10;
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < spells.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return spells[i];
      }
    }
    return spells[0];
  }

  function resolveRound() {
    if (!playerSpell) playerSpell = 'none';
    wizardSpell = aiPickSpell();

    // Player is attacker, wizard is defender perspective
    const result = RESOLUTION[playerSpell][wizardSpell];

    // Apply damage
    playerHP = Math.max(0, playerHP - result.aDmg);
    wizardHP = Math.max(0, wizardHP - result.dDmg);

    // Apply heals
    if (result.healA) {
      playerHP = Math.min(MAX_HP, playerHP + HEAL_AMOUNT);
    }
    if (result.healD) {
      wizardHP = Math.min(MAX_HP, wizardHP + HEAL_AMOUNT);
    }

    const resolveData = {
      playerSpell,
      wizardSpell,
      playerDmg: result.aDmg,
      wizardDmg: result.dDmg,
      playerHealed: result.healA || false,
      wizardHealed: result.healD || false,
      message: result.msg,
      playerHP,
      wizardHP
    };

    setState(STATES.RESOLVE, resolveData);

    // Check game over
    if (playerHP <= 0 || wizardHP <= 0) {
      setTimeout(() => {
        setState(STATES.GAMEOVER, {
          winner: playerHP > 0 ? 'player' : 'wizard',
          rounds: round,
          playerHP,
          wizardHP
        });
      }, 2000);
    } else {
      // Next round
      setTimeout(() => {
        round++;
        setState(STATES.READY);
      }, 2000);
    }
  }

  return {
    STATES, SPELL_NAMES, SPELL_EMOJIS,
    init, getState, getPlayerHP, getWizardHP, getRound,
    startGame, startBattle, startCountdown, startCasting,
    setPlayerSpell, resolveRound, setState
  };
})();
