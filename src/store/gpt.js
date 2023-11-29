import { defineStore } from "pinia";
import { db, rdb } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { set, ref as storageRef } from "firebase/database";

import axios from "axios";

export const useGptStore = defineStore("gpt", {
  state: () => ({
    id: null,
    physicalIP: null,
    documents: [],
    loadingDoc: false,
    key: null,
    result: null,
    resultJson: null,
    resultCommand: null,
    prompts: [],
    aiMoodLightPrompt: [
      {
        role: "system",
        content:
          'The assistants job is LED Mood Light Controller. colorR & colorG & colorB is RGB color number from 0 to 255. brightness is led brightness number from 0 to 255. blinkSpeed is led blink speed number from 0 to 255. Please give the response in a proper JSON format. Here is the example JSON output: { "colorR": "0", "colorG": "0", "colorB": "0", "brightness": "0", "blinkSpeed": "0" }.  ',
      },
      { role: "user", content: "오늘 바깥 날씨에 어울리는 무드등을 틀어줘" },
      { role: "assistant", content: '{"colorR": "200", "colorG": "120", "colorB": "0", "brightness": "200", "blinkSpeed" : "10" }' },
      { role: "user", content: "등을 꺼줘" },
      { role: "assistant", content: '{"colorR": "0", "colorG": "0", "colorB": "0", "brightness": "0", "blinkSpeed" : "0" }' },

    ],
    decoder: new TextDecoder("utf-8")
  }),
  actions: {
    getControllerInfoFromLocalStorage() {
      this.id = localStorage.id
    },
    async getPhysicalIP() {
      await axios({
        method: "get",
        url: "https://ipv4.seeip.org/jsonip",
      })
        .then((res) => {
          console.log(res.data);
          this.physicalIP = res.data.ip;
        })
    },
    async readStream(reader, status) {
      let partialLine = "";

      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { value, done } = await reader.read();
        if (done) break;

        const decodedText = this.decoder.decode(value, { stream: true });

        if (status !== 200) {
          const json = JSON.parse(decodedText); // start with "data: "
          const content = json.error.message ?? decodedText;
          this.result = this.result + content;

          return;
        }

        const chunk = partialLine + decodedText;
        const newLines = chunk.split(/\r?\n/);

        partialLine = newLines.pop() ?? "";

        for (const line of newLines) {
          if (line.length === 0) continue; // ignore empty message
          if (line.startsWith(":")) continue; // ignore sse comment message
          if (line === "data: [DONE]") return; //

          const json = JSON.parse(line.substring(6)); // start with "data: "
          const content =
            status === 200
              ? json.choices[0].delta.content ?? ""
              : json.error.message;
          this.result = this.result + content;

        }
      }
    },
    async reqChatstream(message) {

      try {
        this.loadingDoc = true;
        this.result = '';
        this.prompts = this.aiMoodLightPrompt
        console.log(this.key)
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            Authorization: this.key,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            stream: true,
            messages: [
              ...this.prompts,
              { role: "user", content: message },
            ],
          }),
        });
        console.log(response.body)

        const reader = response.body.getReader();
        await this.readStream(reader, response.status);
        console.log(this.result)
        this.resultJson = JSON.parse(this.result)
        console.log(this.resultJson)
        this.resultCommand = '1'.concat(this.resultJson.colorR.padStart(3, "0"), this.resultJson.colorG.padStart(3, "0"), this.resultJson.colorB.padStart(3, "0"), this.resultJson.brightness.padStart(3, "0"), this.resultJson.blinkSpeed.padStart(3, "0"))
        console.log(this.resultCommand)
        set(storageRef(rdb, 'Controller/' + this.id + '/ledData'), this.resultCommand)
        this.loadingDoc = false;
      } catch (error) {
        console.log(error);
        this.loadingDoc = false;
      } finally {
        console.log("수신완료");
      }

    },
    async getKey() {
      try {
        const docRef = doc(db, "key", "key");
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error("No existe la todo");
        }
        this.key = docSnap.data().key
      } catch (error) {
        console.log(error.message);
      } finally {
        console.log("초기화완료");
      }
    },
  },
});
