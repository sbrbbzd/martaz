import{j as s,L as C,u as H,r as y,m as V}from"./index-Ii0svv0K.js";const A=({children:n,className:t="",variant:r="default",padding:o="md",radius:a="md",hover:d=!1,clickable:e=!1,as:i="div",onClick:c})=>{const h=["card",`card--${r}`,`card--padding-${o}`,`card--radius-${a}`,d?"card--hover":"",e?"card--clickable":"",t].filter(Boolean).join(" ");return s.jsx(i,{className:h,onClick:e?c:void 0,role:e?"button":void 0,tabIndex:e?0:void 0,children:n})},R=({src:n,alt:t="",height:r,className:o="",loading:a="lazy"})=>s.jsx("div",{className:`card__media ${o}`,style:r?{height:typeof r=="number"?`${r}px`:r}:void 0,children:s.jsx("img",{src:n,alt:t,loading:a})}),G=({children:n,className:t=""})=>s.jsx("div",{className:`card__content ${t}`,children:n}),Q=({children:n,className:t=""})=>s.jsx("div",{className:`card__footer ${t}`,children:n}),v=({children:n,variant:t="primary",size:r="md",icon:o,className:a="",dot:d=!1,outline:e=!1,rounded:i=!1})=>{const c=["badge",`badge--${t}`,`badge--${r}`,e?"badge--outline":"",i?"badge--rounded":"",d?"badge--dot":"",o?"badge--with-icon":"",a].filter(Boolean).join(" ");return s.jsxs("span",{className:c,children:[d&&s.jsx("span",{className:"badge__dot"}),o&&s.jsx("span",{className:"badge__icon",children:o}),s.jsx("span",{className:"badge__text",children:n})]})},J=({children:n,variant:t="primary",size:r="md",fullWidth:o=!1,icon:a,iconPosition:d="right",loading:e=!1,className:i="",disabled:c,...h})=>{const m=["btn",`btn--${t}`,`btn--${r}`,o?"btn--full-width":"",a?"btn--with-icon":"",e?"btn--loading":"",i].filter(Boolean).join(" ");return s.jsxs("button",{className:m,disabled:c||e,...h,children:[e&&s.jsx("span",{className:"btn__spinner",children:s.jsx("svg",{viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg",children:s.jsx("circle",{cx:"12",cy:"12",r:"10",fill:"none",strokeWidth:"3"})})}),a&&d==="left"&&!e&&s.jsx("span",{className:"btn__icon btn__icon--left",children:a}),s.jsx("span",{className:"btn__text",children:n}),a&&d==="right"&&!e&&s.jsx("span",{className:"btn__icon btn__icon--right",children:a})]})},P=({children:n,to:t,external:r=!1,variant:o="primary",size:a="md",fullWidth:d=!1,icon:e,iconPosition:i="right",className:c="",...h})=>{const m=["btn",`btn--${o}`,`btn--${a}`,d?"btn--full-width":"",e?"btn--with-icon":"",c].filter(Boolean).join(" ");return r?s.jsxs("a",{href:t,className:m,target:"_blank",rel:"noopener noreferrer",...h,children:[e&&i==="left"&&s.jsx("span",{className:"btn__icon btn__icon--left",children:e}),s.jsx("span",{className:"btn__text",children:n}),e&&i==="right"&&s.jsx("span",{className:"btn__icon btn__icon--right",children:e})]}):s.jsxs(C,{to:t,className:m,...h,children:[e&&i==="left"&&s.jsx("span",{className:"btn__icon btn__icon--left",children:e}),s.jsx("span",{className:"btn__text",children:n}),e&&i==="right"&&s.jsx("span",{className:"btn__icon btn__icon--right",children:e})]})},O="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+UmVzaW0gWcO8a2xlbmVtZWRpPC90ZXh0Pjwvc3ZnPg==",U=({id:n,title:t,price:r,currency:o="₼",location:a,imageUrl:d,featuredImage:e,images:i,category:c,categoryIcon:h,categoryName:m,categorySlug:X,slug:b,condition:f,isFeatured:I=!1,isNew:L=!1,isPromoted:$=!1,createdAt:w,className:B="",userName:j,userImage:p,onClick:N})=>{const{t:l}=H(),[_,W]=y.useState(!1),[M,Z]=y.useState(!1),z=u=>{u.preventDefault(),u.stopPropagation(),W(!_)},T=()=>{N&&N()},k=()=>d||e||(i&&i.length>0?i[0]:O),D=()=>{if(!w)return"";const u=new Date,F=new Date(w),g=Math.floor((u.getTime()-F.getTime())/1e3);if(g<60)return l("time.justNow");if(g<3600){const x=Math.floor(g/60);return`${x} ${l(x===1?"time.minute":"time.minutes")}`}else if(g<86400){const x=Math.floor(g/3600);return`${x} ${l(x===1?"time.hour":"time.hours")}`}else{const x=Math.floor(g/86400);return`${x} ${l(x===1?"time.day":"time.days")}`}},S=b?`/listings/${b}`:`/listings/${n}`;return s.jsx(V.div,{whileHover:{y:-5},transition:{duration:.2},onClick:T,className:B,children:s.jsxs(A,{variant:"default",padding:"none",radius:"lg",className:"listing-card",children:[s.jsxs("div",{className:"listing-card__header",children:[s.jsx(R,{src:k(),alt:t,height:180,className:"listing-card__image",loading:"lazy"}),!M&&s.jsx("div",{className:"listing-card__skeleton"}),s.jsx("img",{src:k(),alt:t,onLoad:()=>Z(!0),style:{display:"none"}}),s.jsxs("div",{className:"listing-card__badges",children:[I&&s.jsx(v,{variant:"secondary",size:"sm",rounded:!0,children:l("featured")}),$&&s.jsx(v,{variant:"secondary",size:"sm",rounded:!0,children:l("promoted")}),L&&s.jsx(v,{variant:"accent",size:"sm",rounded:!0,children:l("new")}),f&&s.jsx(v,{variant:"primary",size:"sm",rounded:!0,children:l(`condition.${f}`)})]}),s.jsx("button",{className:`listing-card__favorite ${_?"listing-card__favorite--active":""}`,onClick:z,"aria-label":l(_?"removeFromFavorites":"addToFavorites"),children:_?s.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"20",height:"20",viewBox:"0 0 24 24",fill:"currentColor",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:s.jsx("path",{d:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"})}):s.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:s.jsx("path",{d:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"})})})]}),s.jsxs(C,{to:S,className:"listing-card__content-link",children:[s.jsxs(G,{className:"listing-card__content",children:[(c||m)&&s.jsxs("div",{className:"listing-card__category",children:[h&&s.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[s.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),s.jsx("line",{x1:"3",y1:"9",x2:"21",y2:"9"}),s.jsx("line",{x1:"9",y1:"21",x2:"9",y2:"9"})]}),m||c]}),s.jsx("h3",{className:"listing-card__title",children:t}),s.jsxs("div",{className:"listing-card__meta",children:[s.jsxs("div",{className:"listing-card__location",children:[s.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[s.jsx("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),s.jsx("circle",{cx:"12",cy:"10",r:"3"})]}),a]}),w&&s.jsxs("div",{className:"listing-card__time",children:[s.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[s.jsx("circle",{cx:"12",cy:"12",r:"10"}),s.jsx("polyline",{points:"12 6 12 12 16 14"})]}),D()]})]}),j&&s.jsxs("div",{className:"listing-card__user",children:[p?s.jsx("img",{src:p,alt:j,className:"listing-card__user-avatar"}):s.jsx("span",{className:"listing-card__user-initials",children:j.charAt(0)}),s.jsx("span",{className:"listing-card__user-name",children:j})]})]}),s.jsxs(Q,{className:"listing-card__footer",children:[s.jsxs("div",{className:"listing-card__price",children:[r.toLocaleString()," ",o]}),s.jsx(J,{variant:"text",size:"sm",icon:s.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[s.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),s.jsx("polyline",{points:"12 5 19 12 12 19"})]}),children:l("viewDetails")})]})]})]})})};export{A as C,P as L,U as a};
