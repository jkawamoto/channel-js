/*
 * Copyright (C) 2018 Junpei Kawamoto
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import EventEmitter from "events";

const eventType = "message";
const typeMsg = "msg";
const typeAck = "ack";
const defaultSleepTime = 500;

const sleep = async time => new Promise(resolve => setTimeout(resolve, time));

// Wrapper a pipe which has addEventListener and sendMessage so that it is an event emitter.
class PipeWrapper extends EventEmitter {

  constructor(pipe, typeMsg, typeAck) {
    super();
    this._pipe = pipe;
    this._typeMsg = typeMsg;
    this._typeAck = typeAck;
    this._pipe.addEventListener(eventType, async (e) => {
      const msg = e.data;
      if (!msg || (msg.type !== typeMsg && msg.type !== typeAck)) {
        return;
      }
      while (!this.emit(msg.type, msg.data, msg.error)) {
        await sleep(defaultSleepTime);
      }
    });
  }

  sendMsg(msg, err) {
    this._pipe.postMessage({
      type: this._typeMsg,
      data: msg,
      // Because of not being able to send an Error object directory,
      // send error name and message as strings.
      error: err && {
        name: err.name,
        message: err.message,
      }
    });
  }

  sendAck(err) {
    this._pipe.postMessage({
      type: this._typeAck,
      // Because of not being able to send an Error object directory,
      // send error name and message as strings.
      error: err && {
        name: err.name,
        message: err.message,
      },
    });
  }

}

export const ChannelClosedError = new Error("Channel is already closed");

export class Channel {

  constructor(pipe, name) {
    this._typeMsg = name ? `${name}.${typeMsg}` : typeMsg;
    this._typeAck = name ? `${name}.${typeAck}` : typeAck;
    this._pipe = new PipeWrapper(pipe, this._typeMsg, this._typeAck);
    this._closed = false;
  }

  async put(msg, err) {
    return new Promise((resolve, reject) => {

      this._pipe.once(this._typeAck, (msg, err) => {
        if (err) {
          const e = new Error(err.message);
          e.name = err.name;
          reject(e);
        } else {
          resolve(msg);
        }
      });

      if (msg instanceof Error) {
        err = msg;
        msg = null;
      }
      this._pipe.sendMsg(msg, err);

    });
  }

  async get() {
    if (this._closed) {
      throw ChannelClosedError;
    }

    return new Promise((resolve, reject) => {
      this._pipe.once(this._typeMsg, (msg, err) => {
        this._pipe.sendAck();
        if (err) {
          const e = new Error(err.message);
          e.name = err.name;
          reject(e);
        } else {
          resolve(msg);
        }
      });
    });
  }

  close() {
    this._closed = true;
    this._pipe.on(this._typeMsg, () => {
      this._pipe.sendAck(ChannelClosedError);
    });
  }

}

export default Channel;
