import{u as H,j as e,b as ee,a as ie,c as se,r,d as te,e as ne,H as re}from"./index-Ii0svv0K.js";import{a as oe}from"./index-CL43C5WK.js";import{L as ae,E as le}from"./index-DGkR6v-M.js";const ce=({currentPage:t,totalPages:c,onPageChange:s})=>{const{t:x}=H(),N=(()=>{const n=[];n.push(1);for(let a=Math.max(2,t-1);a<=Math.min(c-1,t+1);a++)n.indexOf(a)===-1&&n.push(a);c>1&&n.push(c);const p=[];let _=0;for(const a of n)a-_>1&&p.push(-1),p.push(a),_=a;return p})();return e.jsxs("div",{className:"pagination",children:[e.jsx("div",{className:`pagination__item ${t===1?"pagination__item--disabled":""}`,onClick:()=>t>1&&s(t-1),children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),N.map((n,p)=>n===-1?e.jsx("div",{className:"pagination__item pagination__item--ellipsis",children:"..."},`ellipsis-${p}`):e.jsx("div",{className:`pagination__item ${t===n?"pagination__item--active":""}`,onClick:()=>s(n),children:n},n)),e.jsx("div",{className:`pagination__item ${t===c?"pagination__item--disabled":""}`,onClick:()=>t<c&&s(t+1),children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"9 18 15 12 9 6"})})})]})},xe=()=>{const t=ee(),c=ie(),{t:s}=H(),{categorySlug:x}=se(),o=new URLSearchParams(t.search),N=parseInt(o.get("page")||"1",10),n=parseInt(o.get("limit")||"12",10),p=o.get("sort")||"createdAt",_=o.get("order")||"DESC",a=o.get("minPrice")||"",q=o.get("maxPrice")||"",G=o.get("condition")||"",Q=o.get("location")||"",U=o.get("search")||"",[w,D]=r.useState(N),[k]=r.useState(n),[m,L]=r.useState(p),[v,S]=r.useState(_),[d,P]=r.useState(a),[g,b]=r.useState(q),[j,F]=r.useState(G),[u,E]=r.useState(Q),[l,A]=r.useState(U),[W,Z]=r.useState(!1),{data:h,isLoading:z,error:K,refetch:J}=te({page:w,limit:k,sort:m,order:v,category:x,minPrice:d?parseInt(d):void 0,maxPrice:g?parseInt(g):void 0,condition:j||void 0,location:u||void 0,search:l||void 0}),{data:y,isLoading:X}=ne(void 0),M=x&&y&&y.find(i=>i.slug===x)||null;r.useEffect(()=>{const i=new URLSearchParams;w!==1&&i.set("page",w.toString()),k!==12&&i.set("limit",k.toString()),m!=="createdAt"&&i.set("sort",m),v!=="DESC"&&i.set("order",v),d&&i.set("minPrice",d),g&&i.set("maxPrice",g),j&&i.set("condition",j),u&&i.set("location",u),l&&i.set("search",l),c(`${t.pathname}?${i.toString()}`,{replace:!0})},[w,k,m,v,d,g,j,u,l,c,t.pathname]),r.useEffect(()=>{D(1)},[d,g,j,u,l,x]);const Y=i=>{D(i),window.scrollTo(0,0)},V=i=>{P(i.minPrice||""),b(i.maxPrice||""),F(i.condition||""),E(i.location||""),L(i.sort||"createdAt"),S(i.order||"DESC")},$=i=>{A(i)},B=()=>{P(""),b(""),F(""),E(""),A(""),L("createdAt"),S("DESC")},I=()=>{Z(!W)},T=M?s("listings.categoryTitle",{category:M.name}):l?s("listings.searchTitle",{query:l}):s("listings.title");return e.jsxs("div",{className:"listings-page",children:[e.jsxs(re,{children:[e.jsxs("title",{children:[T," | Mart.az"]}),e.jsx("meta",{name:"description",content:s("listings.description")})]}),e.jsxs("div",{className:"listings-page__container",children:[e.jsxs("div",{className:"listings-page__header",children:[e.jsx("div",{className:"listings-page__title-wrapper",children:e.jsx("h1",{className:"listings-page__title",children:T})}),e.jsxs("div",{className:"listings-page__search-container",children:[e.jsx("h3",{children:s("listings.search")}),e.jsxs("div",{className:"listings-page__search",children:[e.jsx("input",{type:"text",placeholder:s("listings.searchPlaceholder"),value:l,onChange:i=>A(i.target.value),onKeyPress:i=>i.key==="Enter"&&$(l)}),e.jsx("button",{onClick:()=>$(l),children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"11",cy:"11",r:"8"}),e.jsx("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]})})]})]}),y&&y.length>0&&e.jsxs("div",{className:"listings-page__categories-container",children:[e.jsx("h3",{children:s("listings.categories")}),e.jsx("div",{className:"listings-page__categories",children:e.jsxs("ul",{children:[e.jsx("li",{children:e.jsx("a",{href:"/listings",className:x?"":"active",children:s("listings.allCategories")})}),y.map(i=>e.jsx("li",{children:e.jsx("a",{href:`/categories/${i.slug}`,className:x===i.slug?"active":"",children:i.name})},i.id))]})})]}),e.jsx("button",{className:"listings-page__filter-toggle",onClick:I,children:W?e.jsxs(e.Fragment,{children:[e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]}),s("listings.hideFilters")]}):e.jsxs(e.Fragment,{children:[e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"4",y1:"21",x2:"4",y2:"14"}),e.jsx("line",{x1:"4",y1:"10",x2:"4",y2:"3"}),e.jsx("line",{x1:"12",y1:"21",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"3"}),e.jsx("line",{x1:"20",y1:"21",x2:"20",y2:"16"}),e.jsx("line",{x1:"20",y1:"12",x2:"20",y2:"3"}),e.jsx("line",{x1:"1",y1:"14",x2:"7",y2:"14"}),e.jsx("line",{x1:"9",y1:"8",x2:"15",y2:"8"}),e.jsx("line",{x1:"17",y1:"16",x2:"23",y2:"16"})]}),s("listings.showFilters")]})})]}),e.jsxs("div",{className:"listings-page__content",children:[(W||window.innerWidth>=992)&&e.jsxs("div",{className:"listings-page__sidebar",children:[e.jsxs("h3",{children:[s("listings.filters"),e.jsx("button",{onClick:B,children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("polyline",{points:"1 4 1 10 7 10"}),e.jsx("path",{d:"M3.51 15a9 9 0 1 0 2.13-9.36L1 10"})]})})]}),e.jsxs("div",{className:"listings-page__sidebar-price",children:[e.jsx("h4",{children:s("listings.price")}),e.jsxs("div",{className:"listings-page__sidebar-price-inputs",children:[e.jsx("input",{type:"number",placeholder:s("listings.minPrice"),value:d,onChange:i=>P(i.target.value)}),e.jsx("input",{type:"number",placeholder:s("listings.maxPrice"),value:g,onChange:i=>b(i.target.value)})]})]}),e.jsxs("div",{className:"listings-page__sidebar-condition",children:[e.jsx("h4",{children:s("listings.condition")}),e.jsxs("select",{value:j,onChange:i=>F(i.target.value),children:[e.jsx("option",{value:"",children:s("listings.anyCondition")}),e.jsx("option",{value:"new",children:s("condition.new")}),e.jsx("option",{value:"likeNew",children:s("condition.likeNew")}),e.jsx("option",{value:"good",children:s("condition.good")}),e.jsx("option",{value:"fair",children:s("condition.fair")}),e.jsx("option",{value:"poor",children:s("condition.poor")})]})]}),e.jsxs("div",{className:"listings-page__sidebar-location",children:[e.jsx("h4",{children:s("listings.location")}),e.jsx("input",{type:"text",placeholder:s("listings.enterLocation"),value:u,onChange:i=>E(i.target.value)})]}),e.jsxs("div",{className:"listings-page__sidebar-buttons",children:[e.jsxs("button",{className:"apply",onClick:()=>{V({minPrice:d,maxPrice:g,condition:j,location:u,sort:m,order:v}),window.innerWidth<992&&I()},children:[e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"9 18 15 12 9 6"})}),s("listings.applyFilters")]}),e.jsxs("button",{className:"clear",onClick:B,children:[e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]}),s("listings.clearFilters")]})]})]}),e.jsx("div",{className:"listings-page__main",children:z||X?e.jsx(ae,{}):K?e.jsx(le,{message:s("common.errorOccurred"),onRetry:J}):e.jsx(e.Fragment,{children:h&&h.data&&h.data.listings&&h.data.listings.length>0?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"listings-page__sort",children:[e.jsxs("div",{className:"listings-page__results",children:[e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"3",width:"7",height:"7"}),e.jsx("rect",{x:"14",y:"3",width:"7",height:"7"}),e.jsx("rect",{x:"14",y:"14",width:"7",height:"7"}),e.jsx("rect",{x:"3",y:"14",width:"7",height:"7"})]}),s("listings.resultsCount",{count:h.data.total})]}),e.jsx("div",{className:"listings-page__sort-options",children:e.jsxs("select",{value:`${m}-${v}`,onChange:i=>{const[f,C]=i.target.value.split("-");L(f),S(C)},children:[e.jsx("option",{value:"createdAt-DESC",children:s("listings.sortNewest")}),e.jsx("option",{value:"createdAt-ASC",children:s("listings.sortOldest")}),e.jsx("option",{value:"price-ASC",children:s("listings.sortPriceLow")}),e.jsx("option",{value:"price-DESC",children:s("listings.sortPriceHigh")}),e.jsx("option",{value:"title-ASC",children:s("listings.sortTitleAZ")}),e.jsx("option",{value:"title-DESC",children:s("listings.sortTitleZA")})]})})]}),e.jsx("div",{className:"listings-page__grid",children:h.data.listings.map(i=>{var f,C,O,R;return e.jsx(oe,{id:i.id,title:i.title,slug:i.slug,price:i.price,currency:i.currency,location:i.location,condition:i.condition,featuredImage:i.featuredImage,images:i.images,createdAt:i.createdAt,isPromoted:i.isPromoted,isFeatured:i.isFeatured,categoryName:(f=i.category)==null?void 0:f.name,categorySlug:(C=i.category)==null?void 0:C.slug,userName:(O=i.user)==null?void 0:O.firstName,userImage:(R=i.user)==null?void 0:R.profileImage},i.id)})}),h.data.totalPages>1&&e.jsx("div",{className:"listings-page__pagination",children:e.jsx(ce,{currentPage:w,totalPages:h.data.totalPages,onPageChange:Y})})]}):e.jsxs("div",{className:"listings-page__empty",children:[e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),e.jsx("h3",{children:s("listings.noResults")}),e.jsx("p",{children:s("listings.tryDifferentFilters")}),e.jsx("button",{onClick:B,children:s("listings.clearFilters")})]})})})]})]})]})};export{xe as default};
