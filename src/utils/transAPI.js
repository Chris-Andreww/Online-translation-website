import MD5 from 'js-md5'
import $ from 'jquery'

export const translateFun = (queryContent, targetLan) => {
    return new Promise((resolve, reject) => {
        let appid = '20221214001496971' //添加自己的app id
        let key = 'OAfmWzH_xc9OoYrEGQfy'    //添加自己的密钥
        let salt = new Date().getTime()
        // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
        let from = 'auto'//源语言语种不确定时可设置为 auto，让api自动检测
        let to = targetLan
        let str1 = appid + queryContent + salt + key
        let sign = MD5(str1)
        $.ajax({
            url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
            type: 'get',
            dataType: 'jsonp',//用来实现跨域请求
            data: {
                q: queryContent,
                from: from,
                to: to,
                appid: appid,
                salt: salt,
                sign: sign
            },
            success: (data) => {
                let result = ''
                if (!data.trans_result) {  //如果没有返回结果，就是请求超过时间限制，稍后重试
                    reject(false)
                    return
                }
                let arrLen = data.trans_result.length//获取传回来的数组长度
                for (let i = 0; i < arrLen; i++) {
                    result += data.trans_result[i].dst
                    if (i != arrLen - 1) {
                        result += '\n'
                    }
                }
                resolve(result)
            }
        });
    })
}