'use strict'

import Vue from 'https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.19/vue.esm.browser.min.js'
import 'https://cdn.jsdelivr.net/npm/jsqr@1.1.1/dist/jsQR.min.js'

const QR_BASE_URL = 'https://chart.apis.google.com/chart?chs=320x320&cht=qr&chl='
const OTHER_SELECT_ITEM = 'その他'
let _GET = new URLSearchParams(window.location.search);
let selectItems = [OTHER_SELECT_ITEM].concat(_GET.getAll('u[]'))

Vue.component('route-top', {
    template: '#template-route-top',
    data() {
        return {
            height: 1280,
            width: 720,
            selectItems: selectItems
        }
    },
    methods: {
        // QR読み込み画面へ移動する
        toReadQr() {
            this.$parent.page = 'route-qrread'
            // 時間差でカメラ処理を始める
            setTimeout(this.cameraStart, 100)
        },
        // トップに戻ってくる
        toTop() {
            clearInterval(this.$parent.intervalId)
            this.$parent.page = 'route-top'
        },
        // QR読み込みを開始する
        cameraStart() {
            if (!navigator.mediaDevices) {
                console.log("getUserMedia() not supported.")
                return
            }

            let _this = this
            // カメラを起動する処理
            var constraints = {
                audio: false,
                video: {
                    width: 1280,
                    height: 720,
                    facingMode: { exact: "environment" },
                    frameRate: { ideal: 5, max: 15 },
                }
            }
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function (stream) {
                    var video = document.getElementById('qrcamera')
                    video.srcObject = stream
                    video.onloadedmetadata = function (e) {
                        video.play()
                    }

                    // QRを読み込む処理
                    const canv = document.createElement("canvas")
                    canv.height = _this.height
                    canv.width = _this.width
                    const context = canv.getContext("2d")

                    // 0.5秒おきにQRの判定をする
                    let intervalId = setInterval(function () {
                        context.drawImage(video, 0, 0, _this.width, _this.height)
                        const imageData = context.getImageData(0, 0, _this.width, _this.height)
                        const code = jsQR(imageData.data, imageData.width, imageData.height)
                        if (code) {
                            console.log("Found QR code", code, code.data)
                            _this.$parent.qrcodeData = code.data
                            _this.createChangeUrl()
                            _this.toTop()
                        }
                    }, 500)
                    _this.$parent.intervalId = intervalId
                })
                .catch(function (err) {
                    console.log(err)
                })
        },
        // 新しいURLをつくる
        createChangeUrl() {
            let url = this.$parent.changeUrl
            if (this.$parent.changeUrl === OTHER_SELECT_ITEM) {
                url = this.$parent.changeUrlOther
            }

            // this.$parent.changedQrcodeData = this.$parent.qrcodeData.replace(/(https?:\/\/)[^/]+(.*)/, `$1${url}$2`)
            this.$parent.changedQrcodeData = this.$parent.qrcodeData.replace(this.$parent.searchStr, url)
        },
    },
    computed: {
        qrcodeData() { return this.$parent.qrcodeData },
        changedQrcodeData: {
            get() { return this.$parent.changedQrcodeData },
            set(newValue) { this.$parent.changedQrcodeData = newValue },
        },
        changedQrcodeImg() { return QR_BASE_URL + this.$parent.changedQrcodeData },
        changeUrl: {
            get() { return this.$parent.changeUrl },
            set(newValue) {
                this.$parent.changeUrl = newValue
                createChangeUrl()
            },
        },
        changeUrlOther: {
            get() { return this.$parent.changeUrlOther },
            set(newValue) {
                this.$parent.changeUrlOther = newValue
                createChangeUrl()
            },
        },
        searchStr: {
            get() { return this.$parent.searchStr },
            set(newValue) { this.$parent.searchStr = newValue }
        },
    },
})
Vue.component('route-qrread', {
    template: '#template-route-qrread',
    methods: {
        toTop() {
            clearInterval(this.$parent.intervalId)
            this.$parent.page = 'route-top'
        },
    }
})

let app = new Vue({
    el: '#app',
    data: {
        page: 'route-top',
        qrcodeData: '',
        changedQrcodeData: '',
        changeUrl: OTHER_SELECT_ITEM,
        changeUrlOther: '',
        searchStr: _GET.get('s'),
        intervalId: null,
    },
})