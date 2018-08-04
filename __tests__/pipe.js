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

import Pipe from "../src/pipe";

describe("Pipe class", () => {

  let pipe;
  beforeEach(() => {
    pipe = new Pipe();
  });

  it("is an event emitter which provides addEventListener and postMessage on top of it", async () => {

    const sampleMsg = "sample message";
    return new Promise((resolve) => {

      pipe.addEventListener("message", (msg) => {
        expect(msg.data).toEqual(sampleMsg);
        resolve();
      });
      pipe.postMessage(sampleMsg);

    });

  });

});
