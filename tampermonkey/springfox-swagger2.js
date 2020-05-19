// ==UserScript==
// @name         springfox-swagger2
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  swagger-ui 展开、折叠、搜索、方法定位
// @author       dairong
// @include      *://*/swagger-ui.html
// @include      *://*/swagger-ui.html#/*
// @include      *://*/*swagger-ui.html*
// @grant        none
// ==/UserScript==

(function (config) {
    'use strict';

    // 展开状态  [ 展开true | 收起false ]
    let state = false
    // 操作按钮
    let myButton
    // 控制器集合
    let operations
    // url hash
    let hash
    // api 数据
    let apiData = []

    // 数据匹配
    function match(val) {
        let valLowerCase = val.toLocaleLowerCase();
        return apiData.filter(item => {
            let pathLowerCase = item.path;
            let summaryLowerCase = item.summary;
            return pathLowerCase.toLocaleLowerCase().includes(valLowerCase) || summaryLowerCase.toLocaleLowerCase().includes(valLowerCase)
        })
    }

    // 模糊搜索（支持方法说明、映射路径）
    function search(e) {
        let val = e.target.value.trim()
        let list = document.getElementById('operList')
        if (val === "") {
            list.classList.add("hidden");
        } else {
            // 匹配方法
            let matchPaths = match(val);
            renderLi(matchPaths);
            list.classList.remove("hidden");
        }
    }

    // 渲染查询结果
    function renderLi(matchPaths) {
        let liHtml = ""
        if (matchPaths.length === 0) {
            liHtml =
                `<li class="list-li"><span class="list-li-left">暂无数据</span><span class="list-li-right"></span></li>`
        } else {
            matchPaths.forEach(item => {
                liHtml +=
                    `<li class="list-li" data-operation-id="${item.operationId}"><span class="list-li-left">${item.method} ${item.path}</span><span class="list-li-right">${item.summary}</span></li>`
            })
        }
        document.getElementById("operUl").innerHTML = liHtml
        // 绑定事件
        let lis = document.querySelectorAll('.list-li')
        lis.forEach(element => {
            element.addEventListener('mouseenter', function () {
                this.classList.add('active')
            });
            element.addEventListener('mouseleave', function () {
                this.classList.remove('active')
            });
            element.addEventListener('click', function (e) {
                let item = apiData.find(val => val.operationId === e.currentTarget.dataset.operationId)
                extendMethod(extendController(item.tag), item.tag, item.operationId);
                let operInput = document.getElementById("operInput");
                operInput.value = ''
                operInput.setAttribute('placeholder',`${item.method} ${item.path}`)
            });
        });
    }

    // input 失去焦点
    function inputBlur() {
        nextTick(() => {
            document.getElementById('operList').classList.add("hidden");
        }, 300)
    }

    // 点击事件
    function buttonClick() {
        if (state) {
            doCollapse();
        } else {
            doExtend();
        }
    }

    // 事件注册
    function initEvent() {
        document.getElementById("operInput").addEventListener("input", search);
        document.getElementById("operInput").addEventListener("blur", inputBlur);
        document.getElementById("operButton").addEventListener("click", buttonClick);
    }

    // UI初始化
    function appendSearchUI() {
        // 样式加载
        let commonStyle = `.extends{position:fixed;display:inline-block;right:15px;top:60px;font-size:14px}.oper{display:inline-table;box-shadow:3px 4px 5px 0 #999}.oper-input{background-color:#fff;border:1px solid #dcdfe6;box-sizing:border-box;color:#606266;font-size:inherit;height:40px;line-height:40px;padding:0 15px;width:700px;cursor:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC10lEQVRYR+2WvWtTURTAfyFp0yQmNWlCGiqUDkLGClIcDCiEpIPulkyCDv4N6u6fIOjQ0sV0KUIHQQuKgyEEdCoO0qWUl8S0CpUIiemTc30vPGryPhIxS88S8u459/7u+bw+7OVnOByeabfb34G4g+5Iyz4bq2+rq6sX5+fnlcr6+voX4PJIp9gY2QHomUwGn89HoVAQANnGTn8kNkcA2TWXy7G1tTU5gIWFBWq12uQAQqEQ+/v7kwOQkzVNOwcQD3wGska6Z4D6SKlvMXJVBWYISqUSU1NTynxjYwNd13ei0eitXq9Hu91+Dtz3CmQFKAEvgR/GJqoPmCI5YP5fWlqSA9XS8vKy+q1Wq+zt7V0FVLlI7wLuOgEJQBF4JYrT09N0Op2nwANgKIDoiie63a7af2VlhdnZWcrlMmtra+rbwcEBu7u7d4CyHYQA6KIQi8WIRCI0m016vZ76PswDon9yckI0Gu3vXSwW2d7eJhwOs7i4SDable75FrjpCmBubk55QG7VarXywBsvAPF4nMPDQwUgks/n2dzcdAXwUUIptxcvGAnXApJeAMRO8sIEEC9UKhVXAJckZDJ0zMnXaDQ4PT3tJ90gF54NwVmAQCAgeeAKQGxVHpg37nQ6HB0d2QIMgrJ6wPCka4D3wPVEIkEwGDTD4BlA+oHf7++zaZrmGkCFweoFCUM6nXYqY9t1LwADwyBVMY54BXgt1SMNxczkcQ73mgOinwS+WsPwvwH+CsMkAFQYrNUwDoSmaTvAbadWbF3/Z2EwWvoN4J0XgH4YpCtKdxxVjG7quMEghWfAvXGSUdp4o9F4AfyZzTYyjFC1ZuuActrIuu7lATsM4IKMfFWbyWT/GeYGwnC9PBTMl9VIHhCjPkQqlUKmm53ouk69rt6oKUDGuStxTBLgA3BtWIeUg4+Pj+Up9wm44upUi5IbAFP9IfAImLHY/wKeAI+9Hmzq/wbyQyQw9l5pkQAAAABJRU5ErkJggg==") 12 3,auto!important;outline:0;vertical-align:middle;display:table-cell}.oper-button{background-color:#f5f8fa;color:#909399;vertical-align:middle;display:table-cell;position:relative;border:1px solid #dcdfe6;border-left:none;height:40px;line-height:1;border-radius:0 4px 4px 0;padding:0 20px;width:120px;white-space:nowrap;outline:0}.list{margin-top:15px;background:#fff;box-shadow:3px 4px 5px 0 #999}.list.hidden{display:none}.list-ul{width:100%;margin:0;padding:0;list-style:none;width:820px;border:1px solid #dcdfe6;max-height:600px;overflow-y:scroll}.list-zw{width:120px}.list-li{padding:10px 15px;border-bottom:1px solid #dcdfe6;overflow:hidden;box-sizing:border-box}.list-li.active{background:#f5f8fa}.list-li-left{width:60%;float:left;white-space:nowrap;word-break:break-all;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box}.list-li-right{box-sizing:border-box;width:40%;float:right;padding-left:15px;white-space:nowrap;word-break:break-all;overflow:hidden;text-overflow:ellipsis;text-align:right}`;
        let styleTextNode = document.createTextNode(commonStyle);
        let styleElement = document.createElement('style');
        styleElement.appendChild(styleTextNode)
        document.body.appendChild(styleElement);
        // 创建根节点
        let rootDiv = document.createElement('div');
        rootDiv.setAttribute("id", "swagger-ui-extends-root");
        document.body.appendChild(rootDiv);

        let rootHtml = `<div class="extends"><div class="oper"><input class="oper-input" id="operInput" type="text" value="" /><button class="oper-button" id="operButton">展开</button></div><div class="list hidden" id="operList"><ul class="list-ul" id="operUl"></ul></div></div>`;
        rootDiv.innerHTML = rootHtml;

        initEvent();
    }

    // 设置按钮文字
    function setMyButtonInnerText(text) {
        myButton = myButton || document.getElementById('operButton');
        myButton.innerText = text
    }

    // 所有控制器按钮
    function getOperationsButtons() {
        if (!operations || operations.length === 0) {
            operations = document.querySelectorAll('.opblock-tag-section')
        }
        return operations
    }

    // 展开
    function doExtend() {
        setMyButtonInnerText(config.loadingText);
        nextTick(() => {
            let operations = getOperationsButtons()
            operations.forEach(btn => {
                let isOpen = btn.className.indexOf('is-open') > -1
                if (!isOpen) {
                    btn.querySelector('.expand-operation').click();
                }
            });
            state = true;
            setMyButtonInnerText(config.collapseText);
        })
    }

    // 收起
    function doCollapse() {
        setMyButtonInnerText(config.loadingText);
        nextTick(() => {
            let operations = getOperationsButtons()
            operations.forEach(btn => {
                let isOpen = btn.className.indexOf('is-open') > -1
                if (isOpen) {
                    btn.querySelector('.expand-operation').click();
                }
            });
            state = false;
            setMyButtonInnerText(config.extendText);
        })
    }

    // next tick 解决加载状态无法及时生效
    function nextTick(fn, time = 50) {
        setTimeout(() => {
            let isFunction = Object.prototype.toString.call(fn) === "[object Function]"
            if (isFunction) {
                fn();
            }
        }, time)
    }

    // 获取查询参数
    function getLoactionHash() {
        // #/auto-msg-controller/checkAutoMsgUsingPOST
        // rdss 自定义 hash
        let reg = /\$.+\$/
        let customHash = reg.exec(window.location.hash)
        if (customHash) {
            hash = window.location.hash
            return {
                type: 3,
                name: decodeURIComponent(customHash[0].replace(/\$/ig, ''))
            }
        }
        hash = decodeURIComponent(window.location.hash)
        let hashArray = hash.split('/').filter(v => v !== '#' && v !== "")
        return {
            type: hashArray.length,
            controllerName: hashArray[0],
            methodName: hashArray[1],
        }
    }

    // 定位控制器
    function extendController(controllerName) {
        let controllerElement = document.getElementById('operations-tag-' + controllerName);
        if (!controllerElement) {
            console.error('未找到页面元素', controllerName)
        }
        let controllerSection = controllerElement.parentElement;
        let isOpen = controllerSection.className.indexOf('is-open') > -1;
        if (!isOpen) {
            controllerElement.querySelector('.expand-operation').click();
        }
        return controllerSection
    }

    // 定位方法
    function extendMethod(controllerSection, controllerName, methodName) {
        let methodElement = controllerSection.querySelector(`#operations-${controllerName}-${methodName}`);
        if (!methodElement) {
            console.error('未找到页面元素', `${controllerName}-${methodName}`)
        }
        let methodIsOpen = methodElement.className.indexOf('is-open') > -1;
        if (!methodIsOpen) {
            let methodHref = methodElement.querySelector('.opblock-summary')
            methodHref.click();
            nextTick(()=>{
                methodHref.scrollIntoView();
            })
        } else {
            let methodHref = methodElement.querySelector('.opblock-summary')
            nextTick(()=>{
                methodHref.scrollIntoView();
            })
        }
        window.location.hash = hash
    }

    // http get
    function get(url, successCallBack) {
        // 解析数据
        function parseData(responseText) {
            let swaggerInfo = JSON.parse(responseText)
            let paths = swaggerInfo.paths
            let pathKeys = Object.keys(paths)
            pathKeys.forEach(pathKey => {
                // 映射路径
                let pathObjs = paths[pathKey]
                let pathObjKeys = Object.keys(pathObjs)
                pathObjKeys.forEach(methodName => {
                    let pathObj = pathObjs[methodName]
                    // 方法集合
                    apiData.push({
                        path: pathKey,
                        method: methodName,
                        tag: pathObj.tags[0],
                        summary: pathObj.summary,
                        description: pathObj.description,
                        operationId: pathObj.operationId,
                    })
                })
            })
            successCallBack && successCallBack(apiData)
        }
        // 发送 http 请求
        let httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === XMLHttpRequest.DONE) {
                if (httpRequest.status === 200) {
                    try {
                        parseData(httpRequest.responseText)
                    } catch (error) {
                        console.error(`数据处理异常：`, httpRequest.responseText);
                    }
                } else {
                    console.error(`请求失败, 检测请求地址是否有效【${url}】`);
                }
            }
        };
        httpRequest.open('GET', url);
        httpRequest.send();
    }

    // 获取 swagger 数据
    function initUI(delegationCustom) {
        // 2、加载 api 数据，挂载查询组件
        get(`${window.location.origin}/v2/api-docs`, (data) => {
            console.log('api 数据准备就绪！', apiData)
            if (delegationCustom) {
                // 自定义 hash 处理
                try {
                    console.log('处理自定义hash', delegationCustom);
                    let matchPath = apiData.find(obj => obj.path.toLocaleLowerCase().includes(delegationCustom.toLocaleLowerCase()))
                    hash = `#/${matchPath.tag}/${matchPath.operationId}`
                    extendMethod(extendController(matchPath.tag), matchPath.tag, matchPath.operationId);
                } catch (error) {
                    console.error('处理自定义hash异常', error)
                }

            }
            appendSearchUI();
        })
    }

    // 初始化组件
    function initSwaggerExtend() {
        // 1、type [ 0无, 1controller, 2method, 3name ]
        let hashResult = getLoactionHash()
        const {
            type,
            controllerName,
            methodName,
            name
        } = hashResult
        console.log('获取 hash', hashResult)
        // 委托处理自定义 hash（依赖 api 数据）
        let delegationCustom
        switch (type) {
            case 1:
                // 中文无法自动展开
                extendController(controllerName);
                break;
            case 2:
                // 定位到方法
                extendMethod(extendController(controllerName), controllerName, methodName);
                break;
            case 3:
                // 自定义 hash 处理
                delegationCustom = name
                break;
            default:
                // 展开所有控制器
                if (config.autoExtend) {
                    setMyButtonInnerText(config.loadingText);
                    nextTick(doExtend)
                }
                break;
        }
        // 2、UI组件注册
        initUI(delegationCustom);
    }

    // swagger 异步加载，定时器捕获页面元素
    let timer = setInterval(() => {
        let operations = getOperationsButtons();
        if (operations.length === 0) {
            // 页面没有加载完成
            return;
        }
        clearInterval(timer);
        console.log('页面加载完成')
        initSwaggerExtend();
    }, 500);

})({
    autoExtend: false,
    extendText: "展开",
    collapseText: "收起",
    loadingText: "loading...",
});