<script setup>
const { $swal } = useNuxtApp()
import { QrcodeCapture } from 'vue3-qrcode-reader';
import VueRecaptcha from 'vue3-recaptcha2';
const config = useRuntimeConfig()

const name = ref(null)
const key = config.public.googlerecapcha
const loadingTimeout = 240000;
const recapchares = ref(null)
const recaptchaVerified = (response) => recapchares.value = response;
const recaptchaExpired = () => VueRecaptcha.reset();
const recaptchaFailed = (reason) => swal.fire({
  title: "ไม่สามารถยืนยันตัวตนได้",
  text: reason ?? "กรุณาลองอีกครั้งหากไม่ได้กรุณาติดต่อผู้ดูแล",
  confirmButtonText: 'ตกลง <i class="fas fa-check"></i>'
});
const recaptchaError = (reason) => swal.fire({
  title: "ไม่สามารถยืนยันตัวตนได้",
  text: reason,
  confirmButtonText: 'ตกลง <i class="fas fa-check"></i>'
});

const swal = $swal.mixin({
  customClass: {
    container: 'bg-black/90 backdrop-blur-sm',
    confirmButton: 'px-4 bg-blue-300 text-white rounded-xl p-2 shadow-lg transition-all duration-200 hover:scale-95 text-lg mx-1',
  },
  buttonsStyling: false
})

function showloading() {
  swal.fire({
    title: "โปรดรอ",
    text: "กำลังรอการตอบสนองจากเซิร์ฟเวอร์",
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => {
      swal.showLoading()
    }
  })
}

async function QRbankSlip(c) {
  showloading()

  if (!recapchares.value) return swal.fire({
    title: 'ผิดพลาด!',
    text: "กรุณากดยืนยันตัวตน!",
    allowOutsideClick: false,
    confirmButtonText: 'ตกลง <i class="fas fa-check"></i>'
  }).then(() => {
    window.location.reload()
  })

  if (!name.value) return swal.fire({
    title: 'ผิดพลาด!',
    text: "กรุณากรอกชื่อ Minecraft!",
    allowOutsideClick: false,
    confirmButtonText: 'ตกลง <i class="fas fa-check"></i>'
  }).then(() => {
    window.location.reload()
  })

  await fetch(config.public.api + '/whitelist', {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      "g-recaptcha-response": recapchares.value,
      "name": name.value,
      "slip": c
    })
  }).then(response => response.json())
    .then(async data => {
      if (data && data.code === 1) {
        return swal.fire({
          title: 'สำเร็จ!',
          text: data.msg,
          allowOutsideClick: false,
          confirmButtonText: 'ตกลง <i class="fas fa-check"></i>'
        }).then(async () => {
          window.location.reload();
        })
      } else {
        return swal.fire({
          title: 'ผิดพลาด!',
          text: data.msg,
          allowOutsideClick: false,
          confirmButtonText: 'ตกลง <i class="fas fa-check"></i>'
        }).then(async () => {
          window.location.reload();
        })
      }
    });
}
</script>

<template>
  <div>
    <div class="flex items-center justify-center mx-auto py-20 max-w-md w-full min-h-[calc(100dvh)] px-3">
      <div class="bg-white/10 rounded-md p-4 relative">
        <img src="/img/alex.webp" class="max-w-[80px] absolute top-[-60px]" alt="">
        <img src="/img/Allay.webp" class="max-w-[80px] right-0 absolute bottom-[-10px]" alt="">
        <div>
          <h1 class="text-3xl font-bold tracking-wider">
            WHITELIST
          </h1>
          <p class="opacity-65">
            *กรุณากรอกให้ตรงตัวเล็กและตัวใหญ่ !<br>อ่านดี ๆ และทำตามขั้นตอนดี ๆ ทำผิดไม่คืนเงินนะจ๊ะ !
          </p>
        </div>
        <div class="mt-2">
          <label for="name">1. ชื่อไอดีแท้</label>
          <input v-model="name" type="text" id="name" class=" mt-1 w-full bg-white/10 outline-none px-2 py-1 rounded-md">
        </div>
        <div class="mt-2 p">
          <div class="text-center">
            <h1>
              โอนที่บัญชีนี้เท่านั้น!
            </h1>
            <p class="text-xs font-bold text-red-400">
              *โอนผ่านธนาคารเท่านั้นห้ามโอนผ่าน Wallet!
            </p>
            <p class="text-xs font-bold text-red-400">
              *รับแค่ธนาคารที่สลิปมี QRCode
            </p>
            <div class="p-2 mt-2 rounded-md bg-white/5">
              <h1 class="text-xl font-bold">
                640-2-21602-4
              </h1>
              <p>
                กสิกร
              </p>
              <p>
                ธนกร พรานพนัส
              </p>
            </div>
          </div>

          <div class="mt-2">
            <label>
              2. ยืนยันตัวตนว่าไม่ใช่บอท
            </label>
            <div class="pt-1">
              <vue-recaptcha theme="light" :sitekey="key" :loading-timeout="loadingTimeout" @verify="recaptchaVerified"
                @expire="recaptchaExpired" @fail="recaptchaFailed" @error="recaptchaError">
              </vue-recaptcha>
            </div>
          </div>

          <div class="mt-2">
            <label for="name">3. โอนเสร็จอัพโหลดสลิปที่นี่</label>
            <qrcode-capture @decode="QRbankSlip" accept="image/*" :capture="null" placeholder="อัพโหลดสลิป"
              class="w-full file:border-0 file:cursor-pointer file:bg-white/10 file:text-white file:py-1 file:px-3 file:rounded-lg outline-none rounded-xl bg-white/5" />
          </div>
        </div>
        <footer class="text-xs opacity-40 mt-4">
          Whitelist V1 | MagicLab
        </footer>
      </div>
    </div>
  </div>
</template>
