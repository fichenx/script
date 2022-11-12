// 通知触发的 JS，在 webUI->SETTING/设置相关->通知相关设置 中进行添加
// 功能:
//   - 过滤通知
//   - 自定义个性化通知
//   - 其他 JS 能做的事
//
// 通过通知触发的 JS 默认带有三个附加临时环境变量 $env.title/$env.body/$env.url
// 通过通知触发的 JS 除 $feed.push 函数不可用之外（防止循环调用），其他默认参数/环境变量都可以直接使用
// （具体查看: https://github.com/elecV2/elecV2P-dei/blob/master/docs/04-JS.md）
/*
 *根据lxk0301大佬的sendNotify.js通知脚本修改的，支持elecV2P的企业微信应用通知脚本。
 * @Author: lxk0301 https://gitee.com/lxk0301
 * @Date: 2020-08-19 16:12:40
 * @Last Modified by: whyour
 * @Last Modified time: 2021-5-1 15:00:54
 * sendNotify 推送通知功能
 * elecV2P脚本管理模块中添加常量QYWX_AM。(详见文档 https://work.weixin.qq.com/api/doc/90000/90135/90236)
    环境变量名 QYWX_AM依次填入 corpid,corpsecret,touser(注:多个成员ID使用|隔开),agentid,消息类型(选填,不填默认文本消息类型)
    注意用,号隔开(英文输入法的逗号)，例如：wwcff56746d9adwers,B-791548lnzXBE6_BWfxdf3kSTMJr9vFEPKAbh6WERQ,mingcheng,1000001,2COXgjH2UIfERF2zxrtUOKgQ9XklUqMdGSWLBoW_lSDAdafat
    可选推送消息类型(推荐使用图文消息（mpnews）):
    - 文本卡片消息: 0 (数字零)
    - 文本消息: 1 (数字一)
    - 图文消息（mpnews）: 素材库图片id, 可查看此教程(http://note.youdao.com/s/HMiudGkb)或者(https://note.youdao.com/ynoteshare1/index.html?id=1a0c8aff284ad28cbd011b29b3ad0191&type=note)
  */
const timeout = 15000;
let accesstoken = "";
let html ="";
let QYWX_AM = "";
if ($env.title && $env.body) {
  console.log('脚本获取到的通知内容:', $env.title, $env.body, $env.url)

/*   // 简单过滤
  if (/重要/.test($env.title)) {
    $feed.bark('【重要通知】 ' + $env.title, $env.body, $env.url)
  } else if (/userid/.test($env.title)) {
    $feed.cust('特别通知 - ' + $env.title, $env.body, $env.url)
  } else if (/测试/.test($env.title)) {
    $message.success(`一条网页消息 -来自通知触发的 JS\n【标题】 ${$env.title} 【内容】 ${$env.body}\n${$env.url}`, 0)
  }

  if (/elecV2P/.test($env.body)) {
    // 对通知内容进行修改
    $env.body = $env.body.replace('elecV2P', 'https://github.com/elecV2/elecV2P')
    // 然后通过自定义通知发送
    qywxamNotify($env.title, $env.body, $env.url)
  } */
   //转换txt内容为html
   //html = $env.body.replace(/[\n\r]/g, '<br>');
   if ($store.get('QYWX_AM')) {
    QYWX_AM = $store.get('QYWX_AM');
    qywxamNotify($env.title, $env.body, $env.url)
  }else{
    console.log('未找到QYWX_AM', '请在脚本管理模块中添加常量!')
  }
} else {
  console.log('没有 $env.title', '该 JS 应该由通知自动触发执行')
}
function ChangeUserId(body) {
    const QYWX_AM_AY = QYWX_AM.split(',');
    if (QYWX_AM_AY[2]) {
      const userIdTmp = QYWX_AM_AY[2].split('|');
      let userId = '';
      for (let i = 0; i < userIdTmp.length; i++) {
        const count = '账号' + (i + 1);
        const count2 = '签到号 ' + (i + 1);
        if (body.match(count2)) {
          userId = userIdTmp[i];
        }
      }
      if (!userId) userId = QYWX_AM_AY[2];
      return userId;
    } else {
      return '@all';
    }
  }
function qywxamNotify(title,body,url) {
    const QYWX_AM_AY = QYWX_AM.split(',');
        $axios(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${QYWX_AM_AY[0]}&corpsecret=${QYWX_AM_AY[1]}`).then(res=>{
            console.log(res.data)
//            var json = JSON.parse(res.data);
            accesstoken = res.data.access_token;
            switch (QYWX_AM_AY[4]) {
                case '0':
                  options = {
                    msgtype: 'textcard',
                    textcard: {
                      title: `${title}`,
                      description: `${body}`,
                      url: 'https://github.com/fichenx/script',
                      btntxt: '更多',
                    },
                  };
                  break;
      
                case '1':
                  options = {
                    msgtype: 'text',
                    text: {
                      content: `${title}\n\n${body}`,
                    },
                  };
                  break;
      
                default:
                  options = {
                    msgtype: 'mpnews',
                    mpnews: {
                      articles: [
                        {
                          title: `${title}`,
                          thumb_media_id: `${QYWX_AM_AY[4]}`,
                          author: `智能助手`,
                          content_source_url: ``,
                          content: `${html}`,
                          digest: `${body}`,
                        },
                      ],
                    },
                  };
              }
              if (!QYWX_AM_AY[4]) {
                //如不提供第四个参数,则默认进行文本消息类型推送
                options = {
                  msgtype: 'text',
                  text: {
                    content: `${title}\n\n${body}`,
                  },
                };
              }
            let req = {
                url: `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accesstoken}`,
                headers: {
                  'Content-Type': 'application/json; charset=UTF-8'
                },
                method: 'post',
                data: {
                    "touser" : `${ChangeUserId(body)}`,
                    "agentid" : `${QYWX_AM_AY[3]}`,
                    safe: '0',
                    ...options,
                }
              }
            $axios(req).then(res=>{
              console.log('企业微信应用 通知结果', res.data)
            }).catch(e=>{
              console.error('企业微信应用 通知失败', e.message)
            })
        }).catch(e=>{
                console.log(e)
        })

}
