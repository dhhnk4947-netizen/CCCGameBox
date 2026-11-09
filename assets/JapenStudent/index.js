System.register("chunks:///_virtual/JapenStudent",["./JapenStudent.ts"],(function(){return{setters:[null],execute:function(){}}}));

System.register("chunks:///_virtual/JapenStudent.ts",["./rollupPluginModLoBabelHelpers.js","cc","./tea.decorators.ts","./GameItem.ts"],(function(t){var n,e,i,o,r,u,a,c,p,s;return{setters:[function(t){n=t.applyDecoratedDescriptor,e=t.inheritsLoose,i=t.initializerDefineProperty,o=t.assertThisInitialized},function(t){r=t.cclegacy,u=t._decorator,a=t.Node},function(t){c=t.Path},function(t){p=t.GameMapper,s=t.default}],execute:function(){var l,f,d,h,y,v;r._RF.push({},"72de2lgSbxBUbOC5qJt2p+r","JapenStudent",void 0);var B=u.ccclass;u.property,t("JapenStudent",(l=B("JapenStudent"),f=p("JapenStudent","main"),d=c("quitBtn"),l(h=f((v=n((y=function(t){function n(){for(var n,e=arguments.length,r=new Array(e),u=0;u<e;u++)r[u]=arguments[u];return n=t.call.apply(t,[this].concat(r))||this,i(n,"quitBtn",v,o(n)),n}e(n,t);var r=n.prototype;return r.onShow=function(){},r.onHide=function(){},r.onMount=function(){this.quitBtn.on(a.EventType.TOUCH_END,this.onClickQuitBtn.bind(this))},r.onInit=function(){},r.onClickQuitBtn=function(t){stopGame()},n}(s)).prototype,"quitBtn",[d],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),h=y))||h)||h));r._RF.pop()}}}));

(function(r) {
  r('virtual:///prerequisite-imports/JapenStudent', 'chunks:///_virtual/JapenStudent'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});