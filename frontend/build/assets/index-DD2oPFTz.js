import{u as T,i as E,b as O,f as S,s as z,k as B,r as n,j as e,L as c,l as H,m as R}from"./index-5xEUM_gm.js";import{H as q}from"./index.esm-5bBGV7pT.js";const G=()=>{const{t:i}=T(),f=E(),N=O(),a=S(z),u=S(B),[l,m]=n.useState("profile"),[r,x]=n.useState({firstName:(a==null?void 0:a.firstName)||"",lastName:(a==null?void 0:a.lastName)||"",email:(a==null?void 0:a.email)||"",phone:(a==null?void 0:a.phone)||"",profileImage:(a==null?void 0:a.profileImage)||""}),[j,v]=n.useState([]),[F,p]=n.useState(!1),[b,y]=n.useState([]),[$,h]=n.useState(!1),[d,C]=n.useState(null),[L,w]=n.useState(null);n.useEffect(()=>{if(!a){N("/login");return}x({firstName:a.firstName||"",lastName:a.lastName||"",email:a.email||"",phone:a.phone||"",profileImage:a.profileImage||""}),l==="listings"&&k(),l==="favorites"&&A()},[a,l,N]);const k=async()=>{p(!0);try{setTimeout(()=>{v(Array(4).fill(null).map((s,t)=>({id:`mock-${t}`,title:`My Listing ${t+1}`,price:Math.floor(Math.random()*1e3)+10,currency:"AZN",status:t%3===0?"active":t%3===1?"pending":"sold",location:"Baku, Azerbaijan",createdAt:new Date().toISOString(),images:[`https://via.placeholder.com/300x200?text=Listing+${t+1}`],viewCount:Math.floor(Math.random()*100)}))),p(!1)},500)}catch(s){console.error("Failed to fetch user listings",s),p(!1)}},A=async()=>{h(!0);try{setTimeout(()=>{y(Array(3).fill(null).map((s,t)=>({id:`mock-fav-${t}`,listing:{id:`mock-listing-${t}`,title:`Favorite Listing ${t+1}`,price:Math.floor(Math.random()*1e3)+10,currency:"AZN",location:"Baku, Azerbaijan",createdAt:new Date().toISOString(),images:[`https://via.placeholder.com/300x200?text=Favorite+${t+1}`],user:{firstName:"Seller",lastName:`${t+1}`}}}))),h(!1)},500)}catch(s){console.error("Failed to fetch favorites",s),h(!1)}},g=s=>{const{name:t,value:o}=s.target;x(U=>({...U,[t]:o}))},D=async s=>{s.preventDefault(),w(null);try{if(await f(H({firstName:r.firstName,lastName:r.lastName,phone:r.phone})).unwrap(),d){const t=new FormData;t.append("image",d),await f(R(t)).unwrap()}}catch(t){w(t.message||"Failed to update profile"),console.error("Failed to update profile",t)}},I=s=>{s.target.files&&s.target.files[0]&&C(s.target.files[0])},M=async s=>{v(t=>t.filter(o=>o.id!==s))},P=async s=>{y(t=>t.filter(o=>o.id!==s))};return e.jsxs("div",{className:"profile-page",children:[e.jsxs(q,{children:[e.jsxs("title",{children:[i("profile.pageTitle")," | Mart.az"]}),e.jsx("meta",{name:"description",content:i("profile.metaDescription")})]}),e.jsxs("div",{className:"container",children:[e.jsx("div",{className:"profile-header",children:e.jsx("h1",{children:i("profile.title")})}),e.jsxs("div",{className:"profile-content",children:[e.jsxs("div",{className:"profile-tabs",children:[e.jsx("button",{className:`tab-button ${l==="profile"?"active":""}`,onClick:()=>m("profile"),children:i("profile.tabs.profile")}),e.jsx("button",{className:`tab-button ${l==="listings"?"active":""}`,onClick:()=>m("listings"),children:i("profile.tabs.listings")}),e.jsx("button",{className:`tab-button ${l==="favorites"?"active":""}`,onClick:()=>m("favorites"),children:i("profile.tabs.favorites")}),e.jsx("button",{className:`tab-button ${l==="messages"?"active":""}`,onClick:()=>m("messages"),children:i("profile.tabs.messages")})]}),e.jsxs("div",{className:"tab-content",children:[l==="profile"&&e.jsx("div",{className:"profile-tab",children:e.jsxs("div",{className:"profile-info",children:[L&&e.jsx("div",{className:"alert alert-danger",children:L}),e.jsxs("form",{onSubmit:D,className:"profile-form",children:[e.jsxs("div",{className:"profile-image-section",children:[e.jsx("div",{className:"profile-image",children:e.jsx("img",{src:d?URL.createObjectURL(d):r.profileImage||"https://via.placeholder.com/150?text=Profile",alt:`${a==null?void 0:a.firstName} ${a==null?void 0:a.lastName}`})}),e.jsxs("div",{className:"image-upload",children:[e.jsx("label",{htmlFor:"profile-image-upload",className:"btn btn-outline-primary",children:i("profile.changePhoto")}),e.jsx("input",{type:"file",id:"profile-image-upload",accept:"image/*",onChange:I,style:{display:"none"}})]})]}),e.jsxs("div",{className:"form-row",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"firstName",children:i("profile.firstNameLabel")}),e.jsx("input",{type:"text",id:"firstName",name:"firstName",value:r.firstName,onChange:g,className:"form-control",required:!0})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"lastName",children:i("profile.lastNameLabel")}),e.jsx("input",{type:"text",id:"lastName",name:"lastName",value:r.lastName,onChange:g,className:"form-control",required:!0})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"email",children:i("profile.emailLabel")}),e.jsx("input",{type:"email",id:"email",name:"email",value:r.email,readOnly:!0,className:"form-control read-only"}),e.jsx("small",{className:"form-text text-muted",children:i("profile.emailHelp")})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"phone",children:i("profile.phoneLabel")}),e.jsx("input",{type:"tel",id:"phone",name:"phone",value:r.phone,onChange:g,className:"form-control"})]}),e.jsx("button",{type:"submit",className:"btn btn-primary",disabled:u,children:i(u?"common.saving":"profile.saveButton")})]}),e.jsxs("div",{className:"profile-security",children:[e.jsx("h3",{children:i("profile.security.title")}),e.jsx(c,{to:"/change-password",className:"btn btn-outline-secondary",children:i("profile.security.changePassword")})]})]})}),l==="listings"&&e.jsxs("div",{className:"listings-tab",children:[e.jsxs("div",{className:"tab-header",children:[e.jsx("h2",{children:i("profile.myListings.title")}),e.jsx(c,{to:"/new-listing",className:"btn btn-primary",children:i("profile.myListings.createNew")})]}),F?e.jsx("div",{className:"loading-spinner",children:e.jsx("div",{className:"spinner"})}):j.length===0?e.jsxs("div",{className:"no-listings",children:[e.jsx("p",{children:i("profile.myListings.noListings")}),e.jsx(c,{to:"/new-listing",className:"btn btn-primary",children:i("profile.myListings.postFirstAd")})]}):e.jsxs("div",{className:"user-listings",children:[e.jsxs("div",{className:"listings-table-header",children:[e.jsx("div",{className:"listing-column listing-title",children:i("profile.myListings.table.title")}),e.jsx("div",{className:"listing-column listing-price",children:i("profile.myListings.table.price")}),e.jsx("div",{className:"listing-column listing-date",children:i("profile.myListings.table.date")}),e.jsx("div",{className:"listing-column listing-status",children:i("profile.myListings.table.status")}),e.jsx("div",{className:"listing-column listing-views",children:i("profile.myListings.table.views")}),e.jsx("div",{className:"listing-column listing-actions",children:i("profile.myListings.table.actions")})]}),j.map(s=>e.jsxs("div",{className:"listing-row",children:[e.jsxs("div",{className:"listing-column listing-title",children:[e.jsx("div",{className:"listing-image",children:e.jsx("img",{src:s.images[0],alt:s.title})}),e.jsxs("div",{className:"listing-title-text",children:[e.jsx(c,{to:`/listings/${s.id}`,children:s.title}),e.jsx("span",{className:"listing-location",children:s.location})]})]}),e.jsxs("div",{className:"listing-column listing-price",children:[s.price," ",s.currency]}),e.jsx("div",{className:"listing-column listing-date",children:new Date(s.createdAt).toLocaleDateString()}),e.jsx("div",{className:"listing-column listing-status",children:e.jsx("span",{className:`status-badge status-${s.status}`,children:i(`profile.myListings.statuses.${s.status}`)})}),e.jsx("div",{className:"listing-column listing-views",children:s.viewCount}),e.jsx("div",{className:"listing-column listing-actions",children:e.jsxs("div",{className:"action-buttons",children:[e.jsx(c,{to:`/edit-listing/${s.id}`,className:"btn btn-sm btn-outline-primary",children:i("profile.myListings.actions.edit")}),s.status==="active"&&e.jsx("button",{onClick:()=>{},className:"btn btn-sm btn-outline-success",children:i("profile.myListings.actions.markSold")}),e.jsx("button",{onClick:()=>M(s.id),className:"btn btn-sm btn-outline-danger",children:i("profile.myListings.actions.delete")})]})})]},s.id))]})]}),l==="favorites"&&e.jsxs("div",{className:"favorites-tab",children:[e.jsx("h2",{children:i("profile.favorites.title")}),$?e.jsx("div",{className:"loading-spinner",children:e.jsx("div",{className:"spinner"})}):b.length===0?e.jsxs("div",{className:"no-favorites",children:[e.jsx("p",{children:i("profile.favorites.noFavorites")}),e.jsx(c,{to:"/listings",className:"btn btn-primary",children:i("profile.favorites.browseListing")})]}):e.jsx("div",{className:"favorites-grid",children:b.map(s=>e.jsxs("div",{className:"favorite-card",children:[e.jsx("div",{className:"favorite-image",children:e.jsx("img",{src:s.listing.images[0],alt:s.listing.title})}),e.jsxs("div",{className:"favorite-details",children:[e.jsx(c,{to:`/listings/${s.listing.id}`,className:"favorite-title",children:s.listing.title}),e.jsxs("p",{className:"favorite-price",children:[s.listing.price," ",s.listing.currency]}),e.jsxs("div",{className:"favorite-meta",children:[e.jsx("span",{className:"favorite-location",children:s.listing.location}),e.jsx("span",{className:"favorite-date",children:new Date(s.listing.createdAt).toLocaleDateString()})]}),e.jsxs("div",{className:"favorite-seller",children:[s.listing.user.firstName," ",s.listing.user.lastName]})]}),e.jsx("button",{onClick:()=>P(s.id),className:"remove-favorite","aria-label":i("profile.favorites.remove"),children:"×"})]},s.id))})]}),l==="messages"&&e.jsxs("div",{className:"messages-tab",children:[e.jsx("h2",{children:i("profile.messages.title")}),e.jsxs("div",{className:"messages-container",children:[e.jsx("p",{children:i("profile.messages.comingSoon")}),e.jsx("p",{children:i("profile.messages.description")})]})]})]})]})]})]})};export{G as default};
//# sourceMappingURL=index-DD2oPFTz.js.map
