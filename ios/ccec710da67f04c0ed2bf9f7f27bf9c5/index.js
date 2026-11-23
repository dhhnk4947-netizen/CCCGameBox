System.register("chunks:///_virtual/TreasureHunter",["./TreasureHunter.ts"],(function(){return{setters:[null],execute:function(){}}}));

System.register("chunks:///_virtual/TreasureHunter.ts",["./rollupPluginModLoBabelHelpers.js","cc","./GameItem.ts","./tea.decorators.ts","./GameMapper.ts","./UIPage.ts"],(function(e){var t,r,n,o,i,a,u,s,l,p,c;return{setters:[function(e){t=e.applyDecoratedDescriptor,r=e.initializerDefineProperty},function(e){n=e.cclegacy,o=e._decorator,i=e.Node,a=e.Tween,u=e.tween},function(e){s=e.default},function(e){l=e.Path},function(e){p=e.GameMapper},function(e){c=e.SCREEN_TYPE}],execute:function(){var h,f,g,m,y,B,T,b;n._RF.push({},"bea0bjIoBxAxI7rseaoSRBW","TreasureHunter",void 0);const{ccclass:d,property:H}=o;e("TreasureHunter",(h=d("TreasureHunter"),f=p("TreasureHunter","main",c.LANDSCAPE),g=l("quitBtn"),m=l("gamePanel/player/rope"),h(y=f((T=t((B=class extends s{constructor(...e){super(...e),r(this,"quitBtn",T,this),r(this,"rope",b,this)}onMount(){this.quitBtn.on(i.EventType.TOUCH_END,this.onClickQuitBtn,this)}onInitRope(){a.stopAllByTarget(this.rope);let e=u(this.rope).to(2.5,{angle:70}).to(2.5,{angle:-70});u(this.rope).set({angle:-70}).repeatForever(e).start()}onShow(){this.onInitRope()}onHide(){}onClickQuitBtn(e){stopGame()}}).prototype,"quitBtn",[g],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),b=t(B.prototype,"rope",[m],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),y=B))||y)||y));n._RF.pop()}}}));

(function(r) {
  r('virtual:///prerequisite-imports/TreasureHunter', 'chunks:///_virtual/TreasureHunter'); 
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