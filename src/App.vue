<template>
  <div id="app">
    <el-input
        :autosize="{ minRows: 1, maxRows: 8}"
        :style="{color: '#000',fontWeight: '600px',fontSize: this.data.fontSize+'px'}"
        type="textarea"
        :rows="8"
        v-model="data.textarea"
        @input="autoTrans"
        placeholder="请输入需要翻译的内容">
    </el-input>

    <div class="mainbutton">
      <!--      下拉菜单选项-->
      <el-dropdown trigger="click" @command="changeLanguage">
        <el-button class="dropmenu" :disabled="data.dropmenuChecked">
          <span class="el-dropdown-link">
           翻译为：{{ data.Language }}
           <i class="el-icon-arrow-down el-icon--right"></i>
          </span>
        </el-button>
        <!--        语言选择下拉菜单-->
        <el-dropdown-menu>
          <el-dropdown-item command="en">英文</el-dropdown-item>
          <el-dropdown-item command="zh">中文</el-dropdown-item>
          <el-dropdown-item command="jp">日语</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

      <!--      翻译按钮-->
      <el-button
          class="btn1"
          style="margin: 20px 0;"
          type="primary"
          @click="goTranslate"
          :loading="data.loadingStat"
      >{{ this.data.loadingStat ? '翻译中' : '翻译' }}
      </el-button>
      <!--      清空按钮-->
      <el-button
          class="btn2"
          style="margin: 20px 0;"
          type="danger"
          @click="clear"
      >清空
      </el-button>
    </div>

    <div class="splitLine">
      翻译结果 ↓
    </div>

    <el-input
        :autosize="{ minRows: 1, maxRows: 8}"
        :style="{color: '#000',fontWeight: '600px',fontSize: this.data.fontSize+'px'}"
        type="textarea"
        :rows="8"
        v-model="data.result"
        placeholder="翻译结果">
    </el-input>
    <div class="copyBtn">

      <!--复制按钮-->
      <el-button
          type="success"
          round
          size="medium"
          icon="el-icon-document-copy"
          @click="copyRes"
      >复制
      </el-button>
      <div class="changeFontSize"><!--字体大小调整按钮-->
        <el-button-group>
          <el-button type="primary" @click="deFontSize">A-</el-button>
          <el-button type="primary" @click="addFontSize">A+</el-button>
        </el-button-group>
      </div>
    </div>


    <div class="checkBox">
      <el-checkbox-group v-model="data.checkList">
        <el-checkbox label="A">保留翻译结果</el-checkbox>
        <el-checkbox label="B">保存当前配置</el-checkbox>
        <el-checkbox label="C">自动翻译&自动语言识别</el-checkbox>
      </el-checkbox-group>
    </div>

  </div>
</template>

<script>
import MD5 from 'js-md5'
import $ from 'jquery'

const regexCn = /[\u4e00-\u9fa5]/; // 匹配中文
const regexEn = /[a-zA-z]/; // 匹配英文
const regexJp = /[\u3040-\u30ff]/; // 匹配日文

export default {
  data() {
    return {
      data: {
        textarea: '',
        result: '',
        targetLan: 'en',//翻译的语言
        Language: 'EN',//选项框显示的语言
        loadingStat: false,//用来显示翻译按钮是否有加载动画
        checkList: [],//用来存放当前复选框的选择信息
        fontSize: 18,
        dropmenuChecked: false,//用来调整翻译下拉选项是否显示/锁定
      }
    }
  },
  methods: {
    //自动翻译功能
    autoTrans() {
      if (this.data.checkList.some(val => val === 'C')) {//如果发现复选框C被选中才会自动翻译
        this.data.loadingStat = true
        //设置防抖方法，让用户停止输入1秒后才自动翻译
        clearTimeout(this.timerT)
        this.timerT = setTimeout(() => {
          this.goTranslate()
        }, 1000)
      }
    },
    changeLanguage(lan) {
      switch (lan) {
        case 'en':
          this.data.targetLan = 'en'
          this.data.Language = 'EN'
          break
        case 'zh':
          this.data.targetLan = 'zh'
          this.data.Language = '中文'
          break
        case 'jp':
          this.data.targetLan = 'jp'
          this.data.Language = '日语'
      }
    },
    //  百度翻译入口,query为用户输入的内容**************************************************************************
    translate(queryContent) {
      let appid = ''
      let key = ''
      let salt = (new Date).getTime()
      let query = queryContent
      // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
      let from = 'auto'//源语言语种不确定时可设置为 auto，让api自动检测
      let to = this.data.targetLan
      let str1 = appid + query + salt + key
      let sign = MD5(str1)
      $.ajax({
        url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
        type: 'get',
        dataType: 'jsonp',//用来实现跨域请求
        data: {
          q: query,
          from: from,
          to: to,
          appid: appid,
          salt: salt,
          sign: sign
        },
        success: (data) => {
          this.data.loadingStat = false
          let arrLen = data.trans_result.length//获取传回来的数组长度
          for (let i = 0; i < arrLen; i++) {
            this.data.result += data.trans_result[i].dst
            if (i != arrLen - 1) {
              this.data.result += '\n'
            }
          }
          this.$notify({
            title: '翻译成功',
            position: 'bottom-left',
            type: 'success',
            duration: 2000
          })
        }
      });
    },
    //做发送前的准备工作
    goTranslate() {
      let inputValue = this.data.textarea.trim()
      //检测输入内容是否为空
      if (inputValue.length === 0) {
        this.$notify({
          title: '请输入内容',
          position: 'bottom-left',
          type: 'error',
          duration: 2000
        })
        this.data.loadingStat = false
        return
      }

      //开启自动翻译并识别语言后启用该功能
      if (this.data.checkList.some(val => val === 'C')) {
        //正则表达式匹配判断用户输入的语言，默认输入英译中，中译英，日译中
        if (inputValue.match(regexCn)) {
          this.data.targetLan = 'en'
          this.data.Language = 'EN'
        } else if (inputValue.match(regexEn)) {
          this.data.targetLan = 'zh'
          this.data.Language = '中文'
        } else if (inputValue.match(regexJp)) {
          this.data.targetLan = 'zh'
          this.data.Language = '中文'
        } else {//未识别的字符默认翻译为英文
          this.data.targetLan = 'en'
          this.data.Language = 'EN'
        }
      }

      if (this.data.checkList.some(val => val === 'A')) {//如果发现复选框A被选中，则保留翻译结果
        true
      } else {
        this.data.result = ''
      }
      this.data.loadingStat = true
      this.translate(inputValue)
    },
    clear() {
      this.data.textarea=''
      this.data.result=''
      this.$notify({
        title: '清空内容成功',
        position: 'bottom-left',
        type: 'success',
        duration: 2000
      })
    },
    copyRes() {
      this.$copyText(this.data.result).then(() => {
        this.$notify({
          title: '复制成功',
          position: 'bottom-left',
          type: 'success',
          duration: 2000
        })
      }, () => {
        this.$notify({
          title: '复制失败',
          message: '翻译结果为空，请输入内容',
          position: 'bottom-left',
          type: 'error',
          duration: 2000
        })
      })
    },
    addFontSize() {
      this.data.fontSize++
    },
    deFontSize() {
      this.data.fontSize--
    }
  },
  watch: {
    data: {
      handler() {
        let BSelect = this.data.checkList.some(val => val === 'B')
        let CSelect = this.data.checkList.some(val => val === 'C');

        if (CSelect) {//如果发现复选框C被选中，则锁定翻译选项
          this.data.dropmenuChecked = true
        } else {
          this.data.dropmenuChecked = false
        }

            //设置防抖方法，让用户停止输入0.5秒后才将数据保存在本地
          clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          if (BSelect) {//如果发现复选框B被选中，则保存当前配置信息
            localStorage.setItem('targetLan', this.data.targetLan)
            localStorage.setItem('Language', this.data.Language)
            localStorage.setItem('checkList', this.data.checkList)
            localStorage.setItem('fontSize', this.data.fontSize)
            localStorage.setItem('dropmenuChecked', this.data.dropmenuChecked)
          } else {
            localStorage.removeItem('targetLan')
            localStorage.removeItem('Language')
            localStorage.removeItem('checkList')
            localStorage.removeItem('fontSize', this.data.fontSize)
            localStorage.removeItem('dropmenuChecked')
          }
        }, 500)

      },
      deep: true
    }

  },
  created() {
    if (localStorage.getItem('checkList')) {//如果是初次启动，checkList的值就为null
      this.data.targetLan = localStorage.getItem('targetLan')
      this.data.Language = localStorage.getItem('Language')
      let str = localStorage.getItem('checkList')

      this.data.checkList = str.split(',')//将从localstorage中获取的字符串转为数组
      this.data.fontSize = localStorage.getItem('fontSize')

      //在使用LocalStorage存储布尔值等数据类型时，LocalStorage会将它们自动转换为字符串类型进行存储
      //因此，在从LocalStorage中获取布尔值变量时，它返回的是一个字符串类型的变量。
      //因此需要将存储在localstorage中的字符串变量转为布尔变量后才进行赋值
      this.data.dropmenuChecked = Boolean(localStorage.getItem('dropmenuChecked'))
    }
  }
}
</script>

<style>
.copyBtn {
  display: flex;
  margin: 10px 30px;
  justify-content: center;
}

.changeFontSize {
  transform: translateX(60%);
}

.splitLine {
  width: 100%;
  margin-top: 4em;
  height: 2em;
  text-align: center;
  line-height: 2em;
  background-color: darkgrey;
}

.checkBox {
  display: flex;
  justify-content: center;
  margin: 50px 50px
}

@media screen and (min-width: 100px) {
  .mainbutton {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .dropmenu {
    padding: 1em 0;
    width: 140px;
    font-size: 18px;
  }

  .btn1,
  .btn2 {
    font-size: 18px;
  }
}

@media screen and (min-width: 800px) {
  .mainbutton {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .dropmenu {
    width: 420px;
    font-size: 18px;
  }

  .btn1,
  .btn2 {
    width: 500px;
    height: 100px;
    font-size: 18px;
  }
}

</style>
