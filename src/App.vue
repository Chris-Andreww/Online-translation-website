<template>
  <div id="app">
    <div class="main">
      <div class="transpanel">
        <el-input :autosize="{ minRows: 5, maxRows: 5 }" :style="{ color: '#000', fontSize: '18px', fontWeight: '600px' }"
          type="textarea" v-model="data.textarea" @input="autoTrans" placeholder="翻译内容">
        </el-input>
        <el-input :autosize="{ minRows: 5, maxRows: 5 }" :style="{ color: '#000', fontSize: '18px', fontWeight: '600px' }"
          type="textarea" v-model="data.result" placeholder="翻译结果">
        </el-input>
      </div>
      <div class="moreFun">
        <div class="mainbutton">
          <!--下拉菜单选项-->
          <el-dropdown trigger="click" @command="changeLanguage">
            <el-button class="dropmenu" :disabled="data.dropmenuChecked">
              <span class="el-dropdown-link">
                翻译为：{{ data.Language }}
                <i class="el-icon-arrow-down el-icon--right"></i>
              </span>
            </el-button>
            <!--语言选择下拉菜单-->
            <el-dropdown-menu>
              <el-dropdown-item command="en">英文</el-dropdown-item>
              <el-dropdown-item command="zh">中文</el-dropdown-item>
              <el-dropdown-item command="jp">日语</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>

          <!--翻译按钮-->
          <el-button class="btn1" style="margin: 20px 0;" type="primary" @click="goTranslate"
            :loading="data.loadingStat">{{
              this.data.loadingStat ? '翻译中' : '翻译' }}
          </el-button>
          <!--清空按钮-->
          <el-button class="btn2" style="margin: 20px 0;" type="danger" @click="clear">清空
          </el-button>
        </div>
        <div class="otherOpe">
          <el-checkbox-group class="checkBox" v-model="data.checkList">
            <el-checkbox label="saveres">保留翻译历史</el-checkbox>
            <el-checkbox label="autotrans">自动翻译</el-checkbox>
            <el-button class="clearHis" @click="clearHis">清空翻译记录</el-button>
          </el-checkbox-group>
          <div class="history">
            <div class="item" @click="fillHisInfo(item)" v-for="(item, index) in data.transHistory" :key="index">
              {{ item }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { translateFun } from '@/utils/transAPI.js'

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
        dropmenuChecked: false,//用来调整翻译下拉选项是否显示/锁定
        transHistory: []
      }
    }
  },
  methods: {
    //自动翻译功能
    autoTrans() {
      if (this.data.checkList.some(val => val === 'autotrans')) {//如果发现复选框C被选中才会自动翻译
        //设置防抖方法，让用户停止输入1秒后才自动翻译
        clearTimeout(this.timerT)
        this.timerT = setTimeout(() => {
          this.goTranslate()
        }, 500)
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
    //做发送前的准备工作
    goTranslate() {
      let inputValue = this.data.textarea.trim()
      //检测输入内容是否为空
      if (inputValue.length === 0) {
        this.notifyFun('请输入内容', 'error')
        this.data.loadingStat = false
        return
      }

      //开启自动翻译并识别语言后启用该功能
      if (this.data.checkList.some(val => val === 'autotrans')) {
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

      if (this.data.checkList.some(val => val === 'saveres')) {//如果发现复选框A被选中，则保留翻译结果
        let hisarr = this.data.transHistory   //将this.data.transHistory的引用赋值给了hisarr
        if (hisarr.length >= 6) {
          hisarr.splice(hisarr.length - 1, 1)
        }
        hisarr.unshift(this.data.textarea)
      }
      this.data.loadingStat = true

      // 百度翻译入口
      translateFun(inputValue, this.data.targetLan).then(res => {
        this.data.loadingStat = false
        this.data.result = res
        this.notifyFun('翻译成功', 'success')
      }).catch(() => {
        this.notifyFun('翻译API调用频率过高，请稍后重试！', 'error')
        this.data.loadingStat = false
      })
    },
    clear() {
      this.data.textarea = ''
      this.data.result = ''
      this.notifyFun('清空内容成功', 'success')
    },
    notifyFun(content, type) {
      this.$notify({
        title: content,
        position: 'bottom-left',
        type: type,
        duration: 2000
      })
    },
    //检查是否启用了自动翻译，启动就禁止用户选择语言
    checkIsAuto() {
      let Select = this.data.checkList.some(val => val === 'autotrans');
      if (Select) {//如果发现自动翻译被选中，则锁定翻译选项
        this.data.dropmenuChecked = true
      } else {
        this.data.dropmenuChecked = false
      }
    },
    //清除翻译历史
    clearHis() {
      this.data.transHistory = []
      this.notifyFun('清空成功', 'success')
    },
    //将历史搜索信息填入输入框并翻译
    fillHisInfo(info) {
      this.data.textarea = info
      this.goTranslate()
    }
  },
  watch: {
    data: {
      handler() {
        this.checkIsAuto()
        //设置防抖方法，让用户停止输入0.5秒后才将数据保存在本地
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          let { Language, targetLan, checkList, transHistory } = this.data
          localStorage.setItem('transConfig', JSON.stringify({ Language, targetLan, checkList, transHistory }))
        }, 500)
      },
      deep: true
    }

  },
  created() {
    if (localStorage.getItem('transConfig')) {//如果是初次启动，checkList的值就为null
      let { Language, targetLan, checkList, transHistory } = JSON.parse(localStorage.getItem('transConfig'))
      this.data.Language = Language
      this.data.targetLan = targetLan
      this.data.checkList = checkList
      this.data.transHistory = transHistory
    }
    this.checkIsAuto()
  }
}
</script>

<style lang="scss">
.main {
  margin-top: 10vh;
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: grid;
  justify-items: center;

  .transpanel {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 700px));
  }

  .moreFun {
    width: 100%;
    max-width: 700px;

    .mainbutton {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      align-items: center;
      gap: 20px;

      .dropmenu {
        padding: 1em 0;
        width: 100%;
        font-size: 18px;
      }

      .btn1,
      .btn2 {
        font-size: 18px;
      }
    }

    .otherOpe {
      display: grid;
      grid-template-columns: 1fr 1fr;

      .checkBox {
        margin-top: 20px;
        display: grid;
        gap: 20px;

        .clearHis {
          align-items: center;
          background: #e7eaf5;
          border-radius: 10px;
          color: #666;
          cursor: pointer;
          display: flex;
          font-family: PingFang SC;
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          justify-content: center;
          padding: 5px 0;
          width: 100px;
        }
      }

      .history {
        margin-top: 10px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 80px));
        gap: 10px;

        .item {
          background: hsla(0, 0%, 100%, .5);
          border-radius: 10px;
          box-sizing: border-box;
          color: #999;
          cursor: pointer;
          font-family: PingFang SC;
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          height: 28px;
          line-height: 28px;
          overflow: hidden;
          padding: 0 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }


  }

}
</style>
