import { ContentScript } from 'cozy-clisk/dist/contentscript'
import Minilog from '@cozy/minilog'
const log = Minilog('ContentScript')
Minilog.enable('AxaCCC')

const loginFormUrl = 'https://connect.axa.fr/login'
const homePageUrl = 'https://espaceclient.axa.fr/#/'

class AxaContentScript extends ContentScript {
  async navigateToLoginForm() {}

  onWorkerEvent({ event, payload }) {}
  onWorkerReady() {}

  async ensureAuthenticated({ account }) {
    this.log('info', '🤖 ensureAuthenticated')
    this.bridge.addEventListener('workerEvent', this.onWorkerEvent.bind(this))
    const credentials = await this.getCredentials()
    if (!account || !credentials) {
      await this.ensureNotAuthenticated()
    }
    if (!await this.isElementInWorker('#inputLogin')){
      await this.goto(loginFormUrl)
      await this.waitForElementInWorker('#inputLogin')
    }
    await this.showLoginFormAndWaitForAuthentication()
    this.log('info', 'ensureAuthenticated - Login successfull !')
    return true
  }

  async ensureNotAuthenticated() {
    this.log('info', '🤖 ensureNotAuthenticated')
    await this.goto(homePageUrl)
    // Waiting for elements indicating we're connected or not
    await this.waitForElementInWorker(`#inputLogin, .btn-disconnect`)
    const authenticated = await this.runInWorker('checkAuthenticated')
    if(!authenticated){
      this.log('info', 'ensureNotAuthenticated - User is already disconnected')
      return true
    }
    await this.runInWorker('click', '.btn-disconnect')
    await this.waitForElementInWorker('#inputLogin')
    this.log('info', 'ensureNotAuthenticated - User has been disconnected')
    return true
  }


  async checkAuthenticated() {
    return Boolean(document.querySelector('.btn-disconnect'))
  }

  async showLoginFormAndWaitForAuthentication() {
    log.debug('showLoginFormAndWaitForAuthentication start')
    await this.setWorkerState({ visible: true })
    await this.runInWorkerUntilTrue({
      method: 'waitForAuthenticated'
    })
    await this.setWorkerState({ visible: false })
  }

  async fetch(context) {
    this.log('info', '🤖 fetch')
  }

  async getUserDataFromWebsite() {
    this.log('info', '🤖 getUserDataFromWebsite')
    return {
      sourceAccountIdentifier: 'defaultTemplateSourceAccountIdentifier'
    }
  }
}


const connector = new AxaContentScript()
connector
  .init({ additionalExposedMethodsNames: [] })
  .catch(err => {
    log.warn(err)
  })
