const Timer = require('./timer')
const Mobbers = require('./mobbers')

class TimerState {
  constructor(options) {
    if (!options) {
      options = {}
    }
    this.secondsPerTurn = 600
    this.mobbers = new Mobbers()
    this.secondsUntilFullscreen = 30
    this.snapThreshold = 25
    this.alertSound = null
    this.alertSoundTimes = []

    this.createTimers(options.Timer || Timer)
  }

  setCallback(callback) {
    this.callback = callback
  }

  createTimers(TimerClass) {
    this.mainTimer = new TimerClass({countDown: true, time: this.secondsPerTurn}, secondsRemaining => {
      this.dispatchTimerChange(secondsRemaining)
      if (secondsRemaining < 0) {
        this.pause()
        this.rotate()
        this.callback('turnEnded')
        this.startAlerts()
      }
    })

    this.alertsTimer = new TimerClass({countDown: false}, alertSeconds => {
      this.callback('alert', alertSeconds)
    })
  }

  dispatchTimerChange(secondsRemaining) {
    this.callback('timerChange', {
      secondsRemaining,
      secondsPerTurn: this.secondsPerTurn
    })
  }

  reset() {
    this.mainTimer.reset(this.secondsPerTurn)
    this.dispatchTimerChange(this.secondsPerTurn)
  }

  startAlerts() {
    this.alertsTimer.reset(0)
    this.alertsTimer.start()
    this.callback('alert', 0)
  }

  stopAlerts() {
    this.alertsTimer.pause()
    this.callback('stopAlerts')
  }

  start() {
    this.mainTimer.start()
    this.callback('started')
    this.stopAlerts()
  }

  pause() {
    this.mainTimer.pause()
    this.callback('paused')
    this.stopAlerts()
  }

  rotate() {
    this.reset()
    this.mobbers.rotate()
    this.callback('rotated', this.mobbers.getCurrentAndNextMobbers())
  }

  initialize() {
    this.rotate()
    this.callback('turnEnded')
  }

  publishConfig() {
    this.callback('configUpdated', this.getState())
    this.callback('rotated', this.mobbers.getCurrentAndNextMobbers())
  }

  addMobber(mobber) {
    this.mobbers.addMobber(mobber)
    this.publishConfig()
    this.callback('rotated', this.mobbers.getCurrentAndNextMobbers())
  }

  removeMobber(mobber) {
    let currentMobber = this.mobbers.getCurrentAndNextMobbers().current
    let isRemovingCurrentMobber = currentMobber ? currentMobber.name == mobber.name : false

    this.mobbers.removeMobber(mobber)

    if (isRemovingCurrentMobber) {
      this.pause()
      this.reset()
      this.callback('turnEnded')
    }

    this.publishConfig()
    this.callback('rotated', this.mobbers.getCurrentAndNextMobbers())
  }

  updateMobber(mobber) {
    this.mobbers.updateMobber(mobber)
    this.publishConfig()
  }

  setSecondsPerTurn(value) {
    this.secondsPerTurn = value
    this.publishConfig()
    this.reset()
  }

  setSecondsUntilFullscreen(value) {
    this.secondsUntilFullscreen = value
    this.publishConfig()
  }

  setSnapThreshold(value) {
    this.snapThreshold = value
    this.publishConfig()
  }

  setAlertSound(soundFile) {
    this.alertSound = soundFile
    this.publishConfig()
  }

  setAlertSoundTimes(secondsArray) {
    this.alertSoundTimes = secondsArray
    this.publishConfig()
  }

  getState() {
    return {
      mobbers: this.mobbers.getAll(),
      secondsPerTurn: this.secondsPerTurn,
      secondsUntilFullscreen: this.secondsUntilFullscreen,
      snapThreshold: this.snapThreshold,
      alertSound: this.alertSound,
      alertSoundTimes: this.alertSoundTimes
    }
  }

  loadState(state) {
    if (state.mobbers) {
      state.mobbers.forEach(x => this.addMobber(x))
    }

    this.setSecondsPerTurn(state.secondsPerTurn || this.secondsPerTurn)
    if (typeof state.secondsUntilFullscreen === 'number') {
      this.setSecondsUntilFullscreen(state.secondsUntilFullscreen)
    }
    if (typeof state.snapThreshold === 'number') {
      this.setSnapThreshold(state.snapThreshold)
    }
    this.alertSound = state.alertSound || null
    this.alertSoundTimes = state.alertSoundTimes || []
  }
}

module.exports = TimerState
