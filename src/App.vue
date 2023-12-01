<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGptStore } from '@/store/gpt'
import { ref as storageRef, child, get } from "firebase/database";
import { rdb } from "@/firebaseConfig";
import { filter } from "lodash";
import bg1 from '@/assets/bg/01.svg'
import bg2 from '@/assets/bg/02.svg'
import bg3 from '@/assets/bg/03.svg'
import bg4 from '@/assets/bg/04.svg'
import bg5 from '@/assets/bg/05.svg'
import bg6 from '@/assets/bg/06.svg'
import bg7 from '@/assets/bg/07.svg'
import bg8 from '@/assets/bg/08.svg'
import bg9 from '@/assets/bg/09.svg'
const selectedBgs = ref([bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8, bg9])
const selectedBg = computed(() => selectedBgs.value[Math.floor(Math.random() * selectedBgs.value.length)])
const gptStore = useGptStore()
const describe = ref('')

const recognition = ref()
const speaking = ref(false)

if (localStorage.id) {
  gptStore.getControllerInfoFromLocalStorage()
}
gptStore.getPhysicalIP()

onMounted(() => {
  // console.log(import.meta.env.VITE_API_KEY)
  get(child(storageRef(rdb), 'Controller')).then((snapshot) => {
    if (snapshot.exists()) {
      console.log(snapshot.val());
      console.log(gptStore.physicalIP)
      const data = snapshot.val();
      controllers.value = filter(data, { PhysicalIP: gptStore.physicalIP });
      console.log(controllers.value)
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
  });
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  console.log(SpeechRecognition)
  recognition.value = new SpeechRecognition()
  console.log(recognition.value)
  recognition.value.continuous = false;
  recognition.value.onresult = function (event) {
    var current = event.resultIndex;
    var transcript = event.results[current][0].transcript;
    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);
    if (!mobileRepeatBug) {
      describe.value += transcript;
    }
    console.log(describe.value)
    gptStore.reqChatstream(describe.value)
  };

  recognition.value.onstart = function () {
    describe.value = ''
    speaking.value = true
  }
  recognition.value.onspeechend = async function () {
    speaking.value = false
    
  }
  recognition.value.onerror = function (event) {
    if (event.error == 'no-speech') {
      console.log('말을 인식하지 못했습니다.')
    }
  }
  gptStore.getKey()
})
const changeController = () => {
  gptStore.id = selectedController.value.ID
  localStorage.id = selectedController.value.ID
}
const controllers = ref([])
const selectedController = ref({
  ID: "",
  IP: "",
  PhysicalIP: "",
})
</script>

<template>
  <v-img :src="selectedBg" height="100vh" cover eager style="background-color:black">
    <v-container class="fill-height pa-0" fluid justify="center">

      <v-card color="#00000050" class="text-white text-center mx-auto pt-4 pa-2 ma-2" flat width="400"
        style="font-size:3vh; border: 3px solid white; border-radius: 17px">
        🔮
        <v-card-title style="font-size: 30px">AI무드등 컨트롤러</v-card-title>
        <v-chip size="large" v-if="gptStore.id">{{ gptStore.id }}</v-chip>
        <v-select variant="outlined" v-if="controllers" label="컨트롤러 화면에 표시되는 ID를 선택해주세요" v-model="selectedController"
          class="pt-2 mx-2" :items="controllers" item-title="ID" return-object outlined dark height="7vh" color="white"
          style="font-size: 1.5rem" @update:model-value="changeController">
        </v-select>
        <v-card-text class="text-start" style="font-size: 30px; line-height: 35px;">
          {{ describe ? describe : "💬 말로 지시해 보세요 :)" }}
        </v-card-text>
        <v-card-text>
          <v-card v-if="gptStore.resultJson" class="pt-2 px-1" rounded="lg"
            :style='`font-size: 15px; width : 100%; background-color : rgb(${gptStore.resultJson.colorR}, ${gptStore.resultJson.colorG}, ${gptStore.resultJson.colorB})`'>
            <v-chip color="red" class="mx-1" size="large">R {{ gptStore.resultJson.colorR }} </v-chip>
            <v-chip color="green" class="mx-1" size="large">G {{ gptStore.resultJson.colorG }} </v-chip>
            <v-chip color="blue" class="mx-1" size="large">B {{ gptStore.resultJson.colorB }} </v-chip>
            <v-chip color="white" class="mx-1" size="large">🔆 {{ gptStore.resultJson.brightness }} </v-chip>
          </v-card>

        </v-card-text>
        <v-card-actions>

          <v-btn block variant="outlined" size="x-large" height="100" @click="recognition.start()" rounded="lg">
            <v-progress-circular v-if="speaking" :size="50" class="mx-auto" color="white"
              indeterminate></v-progress-circular>
            <div v-else style="font-size: 30px">🎙️ 말하기 </div>


          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-img>
</template>

<style>
#app {
  font-family: 'Do Hyeon', sans-serif;
  touch-action: none;
}

/* 
::-webkit-scrollbar {
  display: none;
}
 */
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px #00000090;
  border-radius: 5px;
  background-color: #FFFFFF00;
  margin: 10px
}

::-webkit-scrollbar {
  width: 0px;
  background-color: #FFFFFF00;

}

::-webkit-scrollbar-thumb {
  border-radius: 5px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .3);
  background-color: #FFFFFF60;
}
</style>