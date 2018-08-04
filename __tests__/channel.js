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

import {Channel, ChannelClosedError} from "../src/channel";
import Pipe from "../src/pipe";

describe("Channel class", () => {

  const sampleMsg = {type: "sampleMsg"};
  const sampleError = new Error("expected error");

  describe("Unnamed channel", () => {

    let chan;
    beforeEach(() => {
      chan = new Channel(new Pipe());
    });

    describe("put method", () => {

      it("sends a message and returning a promise to notify the message is received", async () => {
        let resolved = false;
        const promise = chan.put(sampleMsg).then(() => {
          resolved = true;
        });
        expect(resolved).toBeFalsy();

        await expect(chan.get()).resolves.toEqual(sampleMsg);
        await promise;
        expect(resolved).toBeTruthy();
      });

    });

    describe("get method", () => {

      it("returns a promise which is resolved when receiving a message", async () => {
        let res = null;
        const promise = chan.get().then((msg) => {
          res = msg;
        });
        expect(res).toBeNull();

        await chan.put(sampleMsg);
        await promise;
        expect(res).toEqual(sampleMsg);
      });

      it("throws the error instead of returning it if the message is an error", async () => {
        let res = null;
        const promise = chan.get().catch((err) => {
          res = err;
        });
        expect(res).toBeNull();

        await chan.put(sampleError);
        await promise;
        expect(res).toEqual(sampleError);
      });

    });

    describe("close method", () => {

      it("closes the channel and the channel automatically replies an error", async () => {
        chan.close();
        await expect(chan.put("sample msg")).rejects.toEqual(ChannelClosedError);
      });

      it("closes the channel and get throws an error", async () => {
        chan.close();
        await expect(chan.get()).rejects.toEqual(ChannelClosedError);
      });

    });

  });

  describe("Named channel", () => {

    let chanA, chanB;
    beforeEach(() => {
      const pipe = new Pipe();
      chanA = new Channel(pipe, "A");
      chanB = new Channel(pipe, "B");
    });

    it("allows a user sends different types of message on a pipe", async () => {
      let resA = null;
      const promiseA = chanA.get().then((msg) => {
        resA = msg;
      });
      expect(resA).toBeNull();

      let resB = null;
      const promiseB = chanB.get().then((msg) => {
        resB = msg;
      });
      expect(resB).toBeNull();

      await chanA.put(sampleMsg);
      expect(resA).toEqual(sampleMsg);
      expect(resB).toBeNull();

      await chanB.put(sampleMsg);
      expect(resB).toEqual(sampleMsg);

      await promiseA;
      await promiseB;
    });

  });

});
