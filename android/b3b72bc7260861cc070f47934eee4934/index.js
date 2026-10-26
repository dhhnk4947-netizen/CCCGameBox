System.register("chunks:///_virtual/Hall",["./HallView.ts"],(function(){return{setters:[null],execute:function(){}}}));

System.register("chunks:///_virtual/HallView.ts",["./rollupPluginModLoBabelHelpers.js","cc","./tea.decorators.ts","./UIView.ts"],(function(t){var e,n,i,o,l,r,s,a,u,p,c,h,b,B,d,g;return{setters:[function(t){e=t.applyDecoratedDescriptor,n=t.initializerDefineProperty},function(t){i=t.cclegacy,o=t._decorator,l=t.Node,r=t.game,s=t.Tween,a=t.Quat,u=t.tween,p=t.easing,c=t.UITransform,h=t.Mask},function(t){b=t.Path},function(t){B=t.onMount,d=t.TBundleName,g=t.FullView}],execute:function(){var f,m,y,w,N,H,k,C,T,E,O,v,z,S,D,_,L,M,A,U,V;i._RF.push({},"ba2e4Q3CJNKB6pf5gC5K2Kd","HallView",void 0);const{ccclass:Q,property:F}=o;t("HallView",(f=Q("HallView"),m=d("Hall"),y=b("titleBase/title"),w=b("btns/OpenListBtn"),N=b("btns/QuitBtn"),H=b("btns/HelpBtn"),k=b("btns/SettingBtn"),C=b("loading/Mask",c),T=b("loading/Mask",h),E=b("loading"),O=b("btns/HelpBtn"),f(v=m((S=e((z=class extends g{constructor(...t){super(...t),n(this,"titleNode",S,this),n(this,"openListBtn",D,this),n(this,"quitBtn",_,this),n(this,"helpBtn",L,this),n(this,"settingBtn",M,this),n(this,"animNode",A,this),n(this,"animMask",U,this),n(this,"loading",V,this)}mount(){this.openListBtn.on(l.EventType.TOUCH_END,this.onClickOpenListBtn.bind(this)),this.quitBtn.on(l.EventType.TOUCH_END,this.onClickQuitBtn.bind(this)),this.helpBtn.on(l.EventType.TOUCH_END,this.onClickHelpBtn.bind(this)),this.settingBtn.on(l.EventType.TOUCH_END,this.onClickSettingBtn.bind(this))}onShow(){this.titleStartAnim()}onHide(){this.titleStopAnim()}onClickOpenListBtn(){startGame("T2048")}onClickQuitBtn(){r.end()}onClickSettingBtn(){}onClickHelpBtn(){}titleStartAnim(){s.stopAllByTarget(this.titleNode);const t=a.fromEuler(new a,40,6,0),e=a.fromEuler(new a,0,0,0);let n=u(this.titleNode).to(1.5,{rotation:t},{easing:p.bounceOut}).to(2,{rotation:e},{easing:p.bounceIn}).delay(.5);u(this.titleNode).set({rotation:e}).repeatForever(n).start()}titleStopAnim(){s.stopAllByTarget(this.titleNode);const t=a.fromEuler(new a,0,0,0);u(this.titleNode).set({rotation:t}).start()}}).prototype,"titleNode",[y],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),D=e(z.prototype,"openListBtn",[w],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),_=e(z.prototype,"quitBtn",[N],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),L=e(z.prototype,"helpBtn",[H],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),M=e(z.prototype,"settingBtn",[k],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),A=e(z.prototype,"animNode",[C],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),U=e(z.prototype,"animMask",[T],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),V=e(z.prototype,"loading",[E],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),e(z.prototype,"mount",[O,B],Object.getOwnPropertyDescriptor(z.prototype,"mount"),z.prototype),v=z))||v)||v));i._RF.pop()}}}));

(function(r) {
  r('virtual:///prerequisite-imports/Hall', 'chunks:///_virtual/Hall'); 
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