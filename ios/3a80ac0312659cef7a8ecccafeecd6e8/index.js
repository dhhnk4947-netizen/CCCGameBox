System.register("chunks:///_virtual/JapenStudent",["./JapenStudent.ts"],(function(){return{setters:[null],execute:function(){}}}));

System.register("chunks:///_virtual/JapenStudent.ts",["./rollupPluginModLoBabelHelpers.js","cc","./tea.decorators.ts","./GameItem.ts"],(function(t){var e,n,i,o,r,u,a,c;return{setters:[function(t){e=t.applyDecoratedDescriptor,n=t.initializerDefineProperty},function(t){i=t.cclegacy,o=t._decorator,r=t.Node},function(t){u=t.Path},function(t){a=t.GameMapper,c=t.default}],execute:function(){var s,p,l,d,f,h;i._RF.push({},"72de2lgSbxBUbOC5qJt2p+r","JapenStudent",void 0);const{ccclass:B,property:S}=o;t("JapenStudent",(s=B("JapenStudent"),p=a("JapenStudent","main"),l=u("quitBtn"),s(d=p((h=e((f=class extends c{constructor(...t){super(...t),n(this,"quitBtn",h,this)}onShow(){}onHide(){}onMount(){this.quitBtn.on(r.EventType.TOUCH_END,this.onClickQuitBtn.bind(this))}onInit(...t){}onClickQuitBtn(t){stopGame()}}).prototype,"quitBtn",[l],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),d=f))||d)||d));i._RF.pop()}}}));

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