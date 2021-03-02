/* Copyright (c) 1998-2020 ILIAS open source, Extended GPL, see docs/LICENSE */

import ResponseFactory from './response/response-factory.js';
import FetchWrapper from './fetch-wrapper.js';
import FormWrapper from './form-wrapper.js';
import FormCommandAction from './actions/form-command-action.js';

export default class Client {

  /**
   * @type {boolean}
   */
  //debug = true;

  /**
   * @type {string}
   */
  //query_endpoint;

  /**
   * @type {string}
   */
  //command_endpoint;

  /**
   * @type {ResponseFactory}
   */
  //response_factory;

  /**
   * @type {string}
   */
  //form_action;

  /**
   * Constructor
   * @param {string} query_endpoint
   * @param {string} command_endpoint
   * @param {string} form_action
   * @param {ResponseFactory} response_factory
   */
  constructor(query_endpoint, command_endpoint, form_action, response_factory) {
    this.debug = true;
    this.query_endpoint = query_endpoint;
    this.command_endpoint = command_endpoint;
    this.form_action = form_action;
    this.response_factory = response_factory || new ResponseFactory();
  }

  /**
   * @param message
   */
  log(message) {
    if (this.debug) {
      console.log(message);
    }
  }

  /**
   * Send query action
   * @param {QueryAction} query_action
   * @returns {Promise}
   */
  sendQuery(query_action) {
    this.log("client.sendQuery");
    this.log(query_action);
    return new Promise((resolve, reject) => {
      let params = {
        action_id: query_action.getId(),
        component: query_action.getComponent(),
        action: query_action.getType()
      };
      params = Object.assign(params, query_action.getParams());
      FetchWrapper.getJson(this.query_endpoint, params)
      .then(response => {
        this.log("client.sendQuery, response:");
        this.log(response);
        // note that fetch.json() returns yet another promise
        response.json().then(json =>
          resolve(this.response_factory.response(query_action, json))
        ).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  /**
   * Send command action
   * @param {CommandAction} command_action
   * @returns {Promise}
   */
  sendCommand(command_action) {
    this.log("client.sendCommand");
    this.log(command_action);

    // POST FORM
    if (command_action instanceof FormCommandAction) {

      return new Promise((resolve, reject) => {

        const formData = command_action.getParams();
        formData.append("action_id", command_action.getId());
        formData.append("component", command_action.getComponent());
        formData.append("action", command_action.getType());

        FetchWrapper.postForm(this.command_endpoint, formData).then(response => {
          this.log("client.sendCommand, response:");
          this.log(response);
          // note that fetch.json() returns yet another promise
          response.json().then(json =>
            resolve(this.response_factory.response(command_action, json))
          ).catch(err => reject(err));
        }).catch(err => reject(err));
      });

    } else {      // POST JSON

      return new Promise((resolve, reject) => {

        FetchWrapper.postJson(this.command_endpoint, {
          action_id: command_action.getId(),
          component: command_action.getComponent(),
          action: command_action.getType(),
          data: command_action.getParams()
        }).then(response => {
          this.log("client.sendCommand, response:");
          this.log(response);
          // note that fetch.json() returns yet another promise
          response.json().then(json =>
            resolve(this.response_factory.response(command_action, json))
          ).catch(err => reject(err));
        }).catch(err => reject(err));
      });
    }
  }

  /**
   * Send form (includes redirect, use sendCommand to do ajax!)
   * @param {CommandAction} command_action
   */
  sendForm(command_action) {

    const data = command_action.getParams();
    if (data['cmd']) {
      data["cmd[" + data['cmd'] + "]"] = "-";
    }

    this.log("client.sendForm " + this.form_action);
    this.log(data);

    FormWrapper.postForm(this.form_action, data);
  }


}