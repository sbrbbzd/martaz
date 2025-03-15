import{r as p,u as pe,q as fe,a as ue,f as J,i as he,t as ge,v as xe,d as ve,w as je,x as be,j as s,H as Ne,z as ye,F as _e,L as F,p as Q,B as V,C as we,D as Fe,E as $e,G as Le,I as Ie,J as Ce}from"./index-Ii0svv0K.js";let ke={data:""},ze=e=>typeof window=="object"?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||ke,Ee=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,Se=/\/\*[^]*?\*\/|  +/g,B=/\n+/g,y=(e,a)=>{let r="",t="",c="";for(let i in e){let n=e[i];i[0]=="@"?i[1]=="i"?r=i+" "+n+";":t+=i[1]=="f"?y(n,i):i+"{"+y(n,i[1]=="k"?"":a)+"}":typeof n=="object"?t+=y(n,a?a.replace(/([^,])+/g,o=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,m=>/&/.test(m)?m.replace(/&/g,o):o?o+" "+m:m)):i):n!=null&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),c+=y.p?y.p(i,n):i+":"+n+";")}return r+(a&&c?a+"{"+c+"}":c)+t},j={},W=e=>{if(typeof e=="object"){let a="";for(let r in e)a+=r+W(e[r]);return a}return e},Pe=(e,a,r,t,c)=>{let i=W(e),n=j[i]||(j[i]=(m=>{let f=0,u=11;for(;f<m.length;)u=101*u+m.charCodeAt(f++)>>>0;return"go"+u})(i));if(!j[n]){let m=i!==e?e:(f=>{let u,N,g=[{}];for(;u=Ee.exec(f.replace(Se,""));)u[4]?g.shift():u[3]?(N=u[3].replace(B," ").trim(),g.unshift(g[0][N]=g[0][N]||{})):g[0][u[1]]=u[2].replace(B," ").trim();return g[0]})(e);j[n]=y(c?{["@keyframes "+n]:m}:m,r?"":"."+n)}let o=r&&j.g?j.g:null;return r&&(j.g=j[n]),((m,f,u,N)=>{N?f.data=f.data.replace(N,m):f.data.indexOf(m)===-1&&(f.data=u?m+f.data:f.data+m)})(j[n],a,t,o),n},Ae=(e,a,r)=>e.reduce((t,c,i)=>{let n=a[i];if(n&&n.call){let o=n(r),m=o&&o.props&&o.props.className||/^go/.test(o)&&o;n=m?"."+m:o&&typeof o=="object"?o.props?"":y(o,""):o===!1?"":o}return t+c+(n??"")},"");function I(e){let a=this||{},r=e.call?e(a.p):e;return Pe(r.unshift?r.raw?Ae(r,[].slice.call(arguments,1),a.p):r.reduce((t,c)=>Object.assign(t,c&&c.call?c(a.p):c),{}):r,ze(a.target),a.g,a.o,a.k)}let Y,z,E;I.bind({g:1});let b=I.bind({k:1});function De(e,a,r,t){y.p=a,Y=e,z=r,E=t}function _(e,a){let r=this||{};return function(){let t=arguments;function c(i,n){let o=Object.assign({},i),m=o.className||c.className;r.p=Object.assign({theme:z&&z()},o),r.o=/ *go\d+/.test(m),o.className=I.apply(r,t)+(m?" "+m:"");let f=e;return e[0]&&(f=o.as||e,delete o.as),E&&f[0]&&E(o),Y(f,o)}return c}}var Me=e=>typeof e=="function",S=(e,a)=>Me(e)?e(a):e,Te=(()=>{let e=0;return()=>(++e).toString()})(),Oe=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let a=matchMedia("(prefers-reduced-motion: reduce)");e=!a||a.matches}return e}})(),Xe=20,Z=(e,a)=>{switch(a.type){case 0:return{...e,toasts:[a.toast,...e.toasts].slice(0,Xe)};case 1:return{...e,toasts:e.toasts.map(i=>i.id===a.toast.id?{...i,...a.toast}:i)};case 2:let{toast:r}=a;return Z(e,{type:e.toasts.find(i=>i.id===r.id)?1:0,toast:r});case 3:let{toastId:t}=a;return{...e,toasts:e.toasts.map(i=>i.id===t||t===void 0?{...i,dismissed:!0,visible:!1}:i)};case 4:return a.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(i=>i.id!==a.toastId)};case 5:return{...e,pausedAt:a.time};case 6:let c=a.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(i=>({...i,pauseDuration:i.pauseDuration+c}))}}},Ue=[],k={toasts:[],pausedAt:void 0},P=e=>{k=Z(k,e),Ue.forEach(a=>{a(k)})},Re=(e,a="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:a,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(r==null?void 0:r.id)||Te()}),$=e=>(a,r)=>{let t=Re(a,e,r);return P({type:2,toast:t}),t.id},h=(e,a)=>$("blank")(e,a);h.error=$("error");h.success=$("success");h.loading=$("loading");h.custom=$("custom");h.dismiss=e=>{P({type:3,toastId:e})};h.remove=e=>P({type:4,toastId:e});h.promise=(e,a,r)=>{let t=h.loading(a.loading,{...r,...r==null?void 0:r.loading});return typeof e=="function"&&(e=e()),e.then(c=>{let i=a.success?S(a.success,c):void 0;return i?h.success(i,{id:t,...r,...r==null?void 0:r.success}):h.dismiss(t),c}).catch(c=>{let i=a.error?S(a.error,c):void 0;i?h.error(i,{id:t,...r,...r==null?void 0:r.error}):h.dismiss(t)}),e};var qe=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,He=b`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Ge=b`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,Je=_("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${qe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${He} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${Ge} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,Qe=b`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,Ve=_("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${Qe} 1s linear infinite;
`,Be=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,We=b`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Ye=_("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Be} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${We} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Ze=_("div")`
  position: absolute;
`,Ke=_("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,es=b`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ss=_("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${es} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,as=({toast:e})=>{let{icon:a,type:r,iconTheme:t}=e;return a!==void 0?typeof a=="string"?p.createElement(ss,null,a):a:r==="blank"?null:p.createElement(Ke,null,p.createElement(Ve,{...t}),r!=="loading"&&p.createElement(Ze,null,r==="error"?p.createElement(Je,{...t}):p.createElement(Ye,{...t})))},ts=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,is=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,rs="0%{opacity:0;} 100%{opacity:1;}",ls="0%{opacity:1;} 100%{opacity:0;}",os=_("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,ns=_("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,cs=(e,a)=>{let r=e.includes("top")?1:-1,[t,c]=Oe()?[rs,ls]:[ts(r),is(r)];return{animation:a?`${b(t)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${b(c)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};p.memo(({toast:e,position:a,style:r,children:t})=>{let c=e.height?cs(e.position||a||"top-center",e.visible):{opacity:0},i=p.createElement(as,{toast:e}),n=p.createElement(ns,{...e.ariaProps},S(e.message,e));return p.createElement(os,{className:e.className,style:{...c,...r,...e.style}},typeof t=="function"?t({icon:i,message:n}):p.createElement(p.Fragment,null,i,n))});De(p.createElement);I`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;var w=h;const ps=()=>{var R,q,H,G;const{t:e}=pe(),a=fe(),r=ue(),t=J(he),c=J(ge),[i,n]=p.useState("profile"),[o,m]=p.useState({firstName:(t==null?void 0:t.firstName)||"",lastName:(t==null?void 0:t.lastName)||"",email:(t==null?void 0:t.email)||"",phone:(t==null?void 0:t.phone)||"",profileImage:(t==null?void 0:t.profileImage)||""}),[f,u]=p.useState({page:1,limit:10,status:"all"}),N=[{value:"all",label:e("profile.filters.all")},{value:"active",label:e("profile.filters.active")},{value:"pending",label:e("profile.filters.pending")},{value:"sold",label:e("profile.filters.sold")}],[g,K]=p.useState({page:1,limit:10}),{data:x,isLoading:ee,refetch:se}=xe(f,{skip:i!=="listings"||!t}),{data:v,isLoading:ae}=ve({...g,favorites:!0},{skip:i!=="favorites"||!t}),[te,{isLoading:ie}]=je(),[re,{isLoading:ds}]=be(),[A,D]=p.useState(null),[M,T]=p.useState(null),[O,X]=p.useState(null);p.useEffect(()=>{if(!t){r("/login");return}m({firstName:t.firstName||"",lastName:t.lastName||"",email:t.email||"",phone:t.phone||"",profileImage:t.profileImage||""})},[t,r]);const C=l=>{const{name:d,value:L}=l.target;m({...o,[d]:L})},le=async l=>{l.preventDefault(),X(null);try{if(await a(Ie({firstName:o.firstName,lastName:o.lastName,phone:o.phone})).unwrap(),A){const d=new FormData;d.append("profileImage",A),await a(Ce(d)).unwrap(),D(null),T(null)}w.success(e("profile.profileUpdated"))}catch(d){console.error("Failed to update profile:",d),X(d.message||"Failed to update profile. Please try again."),w.error(d.message||e("common.errorOccurred"))}},oe=l=>{var L;const d=(L=l.target.files)==null?void 0:L[0];d&&(D(d),T(URL.createObjectURL(d)))},ne=async l=>{if(window.confirm(e("profile.confirmDeleteListing")))try{await te(l).unwrap(),w.success(e("profile.listingDeleted")),se()}catch(d){console.error("Failed to delete listing:",d),w.error(d.message||e("common.errorOccurred"))}},ce=async l=>{try{await re(l).unwrap(),w.success(e("profile.favoriteRemoved"))}catch(d){console.error("Failed to toggle favorite:",d),w.error(d.message||e("common.errorOccurred"))}},U=()=>{i==="listings"?u(l=>({...l,page:l.page+1})):i==="favorites"&&K(l=>({...l,page:l.page+1}))},de=(l,d)=>`${(l==null?void 0:l.charAt(0))||""}${(d==null?void 0:d.charAt(0))||""}`.toUpperCase(),me=l=>{u(d=>({...d,page:1,status:l}))};return s.jsxs("div",{className:"container",children:[s.jsxs(Ne,{children:[s.jsxs("title",{children:[e("profile.pageTitle")," | Mart.az"]}),s.jsx("meta",{name:"description",content:e("profile.metaDescription")})]}),s.jsx("div",{className:"profile-page",children:s.jsxs("div",{className:"profile-container",children:[s.jsxs("div",{className:"profile-tabs",children:[s.jsx("div",{className:`profile-tabs__item ${i==="profile"?"profile-tabs__item--active":""}`,onClick:()=>n("profile"),children:e("profile.tabs.profile")}),s.jsx("div",{className:`profile-tabs__item ${i==="listings"?"profile-tabs__item--active":""}`,onClick:()=>n("listings"),children:e("profile.tabs.listings")}),s.jsx("div",{className:`profile-tabs__item ${i==="favorites"?"profile-tabs__item--active":""}`,onClick:()=>n("favorites"),children:e("profile.tabs.favorites")})]}),s.jsxs("div",{className:"profile-content",children:[i==="profile"&&s.jsxs("div",{className:"profile-info",children:[s.jsxs("div",{className:"profile-stats",children:[s.jsxs("div",{className:"stat-card",children:[s.jsx("div",{className:"stat-card__value",children:((R=x==null?void 0:x.data)==null?void 0:R.total)||0}),s.jsx("div",{className:"stat-card__label",children:e("profile.stats.listings")})]}),s.jsxs("div",{className:"stat-card",children:[s.jsx("div",{className:"stat-card__value",children:((q=v==null?void 0:v.data)==null?void 0:q.total)||0}),s.jsx("div",{className:"stat-card__label",children:e("profile.stats.favorites")})]}),s.jsxs("div",{className:"stat-card",children:[s.jsx("div",{className:"stat-card__value",children:t!=null&&t.createdAt?new Date(t.createdAt).toLocaleDateString():"-"}),s.jsx("div",{className:"stat-card__label",children:e("profile.stats.memberSince")})]})]}),s.jsxs("div",{className:"profile-info__header",children:[s.jsx("h2",{children:e("profile.personalInfo")}),s.jsx("p",{children:e("profile.personalInfoSubtitle")})]}),s.jsxs("form",{onSubmit:le,className:"profile-info__form",children:[s.jsxs("div",{className:"profile-info__avatar",children:[s.jsx("div",{className:"profile-info__avatar-image",children:M||o.profileImage?s.jsx("img",{src:M||o.profileImage,alt:`${o.firstName} ${o.lastName}`}):s.jsx("span",{children:de(o.firstName,o.lastName)})}),s.jsxs("div",{className:"profile-info__avatar-upload",children:[s.jsx("input",{type:"file",id:"profileImage",name:"profileImage",accept:"image/*",onChange:oe}),s.jsxs("label",{htmlFor:"profileImage",children:[s.jsx(ye,{size:16}),e("profile.changePhoto")]})]})]}),s.jsxs("div",{className:"profile-info__details",children:[s.jsxs("div",{className:"form-row",children:[s.jsxs("div",{className:"form-group",children:[s.jsx("label",{htmlFor:"firstName",children:e("profile.firstName")}),s.jsx("input",{type:"text",id:"firstName",name:"firstName",value:o.firstName,onChange:C,className:"form-control",required:!0})]}),s.jsxs("div",{className:"form-group",children:[s.jsx("label",{htmlFor:"lastName",children:e("profile.lastName")}),s.jsx("input",{type:"text",id:"lastName",name:"lastName",value:o.lastName,onChange:C,className:"form-control",required:!0})]})]}),s.jsxs("div",{className:"form-group",children:[s.jsx("label",{htmlFor:"email",children:e("profile.email")}),s.jsx("input",{type:"email",id:"email",name:"email",value:o.email,className:"form-control",disabled:!0})]}),s.jsxs("div",{className:"form-group",children:[s.jsx("label",{htmlFor:"phone",children:e("profile.phone")}),s.jsx("input",{type:"tel",id:"phone",name:"phone",value:o.phone,onChange:C,className:"form-control",placeholder:"+994 XX XXX XX XX"})]}),O&&s.jsxs("div",{className:"alert alert-danger",children:[s.jsx(_e,{size:18}),s.jsx("span",{children:O})]}),s.jsxs("div",{className:"form-actions",children:[s.jsx("button",{type:"submit",className:"btn-primary",disabled:c,children:e(c?"common.saving":"profile.saveChanges")}),s.jsx("button",{type:"button",className:"btn-outline",onClick:()=>r("/"),children:e("common.cancel")})]})]})]})]}),i==="listings"&&s.jsxs("div",{className:"user-listings",children:[s.jsxs("div",{className:"user-listings__header",children:[s.jsx("h2",{children:e("profile.myListings")}),s.jsxs(F,{to:"/create-listing",className:"btn-add",children:[s.jsx(Q,{size:16}),e("profile.createListing")]})]}),s.jsx("div",{className:"user-listings__filters",children:s.jsxs("div",{className:"filter-group",children:[s.jsxs("label",{children:[e("profile.filters.status"),":"]}),s.jsx("div",{className:"status-filter",children:N.map(l=>s.jsx("button",{className:`status-filter__btn ${f.status===l.value?"status-filter__btn--active":""}`,onClick:()=>me(l.value),children:l.label},l.value))})]})}),ee?s.jsxs("div",{className:"loading-state",children:[s.jsx("div",{className:"loading-spinner"}),s.jsx("p",{children:e("common.loading")})]}):(H=x==null?void 0:x.data)!=null&&H.listings&&x.data.listings.length>0?s.jsxs(s.Fragment,{children:[s.jsx("div",{className:"user-listings__grid",children:x.data.listings.map(l=>{var d;return s.jsxs("div",{className:"user-listings__item",children:[s.jsxs("div",{className:"user-listings__item-image",children:[s.jsx("img",{src:l.featuredImage||((d=l.images)==null?void 0:d[0])||`https://placehold.co/300x200?text=${encodeURIComponent(l.title)}`,alt:l.title}),s.jsx("div",{className:`status-badge status-badge--${l.status}`,children:e(`profile.listingStatus.${l.status}`)})]}),s.jsxs("div",{className:"user-listings__item-content",children:[s.jsx("h3",{className:"user-listings__item-title",children:l.title}),s.jsxs("div",{className:"user-listings__item-price",children:[l.price," ",l.currency]}),s.jsxs("div",{className:"user-listings__item-meta",children:[s.jsxs("div",{className:"location",children:[s.jsx(V,{size:12}),s.jsx("span",{children:l.location})]}),s.jsxs("div",{className:"views",children:[s.jsx(we,{size:12}),s.jsx("span",{children:l.views})]})]}),s.jsxs("div",{className:"user-listings__item-actions",children:[s.jsxs(F,{to:`/edit-listing/${l.id}`,className:"btn-edit",children:[s.jsx(Fe,{size:14}),e("common.edit")]}),s.jsxs("button",{onClick:()=>ne(l.id),className:"btn-delete",disabled:ie,children:[s.jsx($e,{size:14}),e("common.delete")]})]})]})]},l.id)})}),x.data.totalPages>f.page&&s.jsx("div",{className:"load-more",children:s.jsx("button",{className:"btn-outline",onClick:U,children:e("common.loadMore")})})]}):s.jsxs("div",{className:"user-listings__empty",children:[s.jsx("h3",{children:e("profile.noListings")}),s.jsx("p",{children:e("profile.noListingsDescription")}),s.jsxs(F,{to:"/create-listing",className:"btn-add",children:[s.jsx(Q,{size:18}),e("profile.createListing")]})]})]}),i==="favorites"&&s.jsxs("div",{className:"favorites",children:[s.jsx("div",{className:"favorites__header",children:s.jsx("h2",{children:e("profile.favorites")})}),ae?s.jsxs("div",{className:"loading-state",children:[s.jsx("div",{className:"loading-spinner"}),s.jsx("p",{children:e("common.loading")})]}):(G=v==null?void 0:v.data)!=null&&G.listings&&v.data.listings.length>0?s.jsxs(s.Fragment,{children:[s.jsx("div",{className:"favorites__grid",children:v.data.listings.map(l=>{var d;return s.jsxs("div",{className:"favorites__item",children:[s.jsxs("div",{className:"favorites__item-image",children:[s.jsx("img",{src:l.featuredImage||((d=l.images)==null?void 0:d[0])||`https://placehold.co/300x200?text=${encodeURIComponent(l.title)}`,alt:l.title}),s.jsx("button",{className:"favorite-btn favorite-btn--active",onClick:()=>ce(l.id),"aria-label":e("common.remove"),children:s.jsx(Le,{size:16})})]}),s.jsxs("div",{className:"favorites__item-content",children:[s.jsx("h3",{className:"favorites__item-title",children:s.jsx(F,{to:`/listing/${l.slug||l.id}`,children:l.title})}),s.jsxs("div",{className:"favorites__item-price",children:[l.price," ",l.currency]}),s.jsx("div",{className:"favorites__item-meta",children:s.jsxs("div",{className:"location",children:[s.jsx(V,{size:12}),s.jsx("span",{children:l.location})]})})]})]},l.id)})}),v.data.totalPages>g.page&&s.jsx("div",{className:"load-more",children:s.jsx("button",{className:"btn-outline",onClick:U,children:e("common.loadMore")})})]}):s.jsxs("div",{className:"favorites__empty",children:[s.jsx("h3",{children:e("profile.noFavorites")}),s.jsx("p",{children:e("profile.noFavoritesDescription")}),s.jsx(F,{to:"/listings",className:"btn-browse",children:e("profile.browseListing")})]})]})]})]})})]})};export{ps as default};
