System.register("chunks:///_virtual/TreasureHunter",["./TreasureHunter.ts"],(function(){return{setters:[null],execute:function(){}}}));

System.register("chunks:///_virtual/TreasureHunter.ts",["./rollupPluginModLoBabelHelpers.js","cc","./GameItem.ts","./tea.decorators.ts","./GameMapper.ts","./UIPage.ts"],(function(e){var t,n,r,o,i,a,u,s,c,l,p,f,h;return{setters:[function(e){t=e.applyDecoratedDescriptor,n=e.inheritsLoose,r=e.initializerDefineProperty,o=e.assertThisInitialized},function(e){i=e.cclegacy,a=e._decorator,u=e.Node,s=e.Tween,c=e.tween},function(e){l=e.default},function(e){p=e.Path},function(e){f=e.GameMapper},function(e){h=e.SCREEN_TYPE}],execute:function(){var y,g,T,m,v,B,b,d;i._RF.push({},"bea0bjIoBxAxI7rseaoSRBW","TreasureHunter",void 0);var H=a.ccclass;a.property,e("TreasureHunter",(y=H("TreasureHunter"),g=f("TreasureHunter","main",h.LANDSCAPE),T=p("quitBtn"),m=p("gamePanel/player/rope"),y(v=g((b=t((B=function(e){function t(){for(var t,n=arguments.length,i=new Array(n),a=0;a<n;a++)i[a]=arguments[a];return t=e.call.apply(e,[this].concat(i))||this,r(t,"quitBtn",b,o(t)),r(t,"rope",d,o(t)),t}n(t,e);var i=t.prototype;return i.onMount=function(){this.quitBtn.on(u.EventType.TOUCH_END,this.onClickQuitBtn,this)},i.onInitRope=function(){s.stopAllByTarget(this.rope);var e=c(this.rope).to(2.5,{angle:70}).to(2.5,{angle:-70});c(this.rope).set({angle:-70}).repeatForever(e).start()},i.onShow=function(){this.onInitRope()},i.onHide=function(){},i.onClickQuitBtn=function(e){stopGame()},t}(l)).prototype,"quitBtn",[T],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),d=t(B.prototype,"rope",[m],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),v=B))||v)||v));i._RF.pop()}}}));

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