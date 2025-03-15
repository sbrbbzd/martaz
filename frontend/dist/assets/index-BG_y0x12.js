import{u as k,q as F,a as T,f as m,t as y,K as L,r as h,j as e,H as R,F as C,P as p,M as S,Q as $,N as g,L as x,R as q}from"./index-Ii0svv0K.js";const E=()=>{const{t:s}=k(),N=F(),f=T(),o=m(y),c=m(L),[a,u]=h.useState({firstName:"",lastName:"",email:"",phone:"",password:"",confirmPassword:"",agreeTerms:!1}),[r,d]=h.useState({}),l=i=>{const{name:t,value:w,type:b,checked:P}=i.target;u(n=>({...n,[t]:b==="checkbox"?P:w})),r[t]&&d(n=>({...n,[t]:void 0}))},j=()=>{const i={};return a.firstName.trim()||(i.firstName=s("register.firstNameRequired")),a.lastName.trim()||(i.lastName=s("register.lastNameRequired")),a.email.trim()?/\S+@\S+\.\S+/.test(a.email)||(i.email=s("register.emailInvalid")):i.email=s("register.emailRequired"),a.phone&&!/^\+?\d{10,15}$/.test(a.phone.replace(/\s/g,""))&&(i.phone=s("register.phoneInvalid")),a.password?a.password.length<8&&(i.password=s("register.passwordTooShort")):i.password=s("register.passwordRequired"),a.password!==a.confirmPassword&&(i.confirmPassword=s("register.passwordsDoNotMatch")),a.agreeTerms||(i.agreeTerms=s("register.termsRequired")),d(i),Object.keys(i).length===0},v=async i=>{if(i.preventDefault(),!!j())try{await N(q({firstName:a.firstName,lastName:a.lastName,email:a.email,phone:a.phone,password:a.password})).unwrap(),f("/login?registered=true")}catch(t){console.error("Registration failed:",t)}};return e.jsxs("div",{className:"auth-page",children:[e.jsxs(R,{children:[e.jsxs("title",{children:[s("register.pageTitle")," | Mart.az"]}),e.jsx("meta",{name:"description",content:s("register.metaDescription")})]}),e.jsxs("div",{className:"auth-container",children:[e.jsxs("div",{className:"auth-form-container",children:[e.jsx("h1",{className:"auth-title",children:s("register.title")}),e.jsx("p",{className:"auth-subtitle",children:s("register.subtitle")}),c&&e.jsxs("div",{className:"alert alert-danger",role:"alert",children:[e.jsx(C,{size:18}),e.jsx("span",{children:c})]}),e.jsxs("form",{onSubmit:v,className:"auth-form",children:[e.jsxs("div",{className:"form-row",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"firstName",children:s("register.firstNameLabel")}),e.jsxs("div",{className:"input-icon-wrapper",children:[e.jsx(p,{className:"input-icon"}),e.jsx("input",{type:"text",id:"firstName",name:"firstName",value:a.firstName,onChange:l,className:`form-control ${r.firstName?"is-invalid":""}`,placeholder:s("register.firstNamePlaceholder")})]}),r.firstName&&e.jsx("div",{className:"invalid-feedback",children:r.firstName})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"lastName",children:s("register.lastNameLabel")}),e.jsxs("div",{className:"input-icon-wrapper",children:[e.jsx(p,{className:"input-icon"}),e.jsx("input",{type:"text",id:"lastName",name:"lastName",value:a.lastName,onChange:l,className:`form-control ${r.lastName?"is-invalid":""}`,placeholder:s("register.lastNamePlaceholder")})]}),r.lastName&&e.jsx("div",{className:"invalid-feedback",children:r.lastName})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"email",children:s("register.emailLabel")}),e.jsxs("div",{className:"input-icon-wrapper",children:[e.jsx(S,{className:"input-icon"}),e.jsx("input",{type:"email",id:"email",name:"email",value:a.email,onChange:l,className:`form-control ${r.email?"is-invalid":""}`,placeholder:s("register.emailPlaceholder")})]}),r.email&&e.jsx("div",{className:"invalid-feedback",children:r.email})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"phone",children:s("register.phoneLabel")}),e.jsxs("div",{className:"input-icon-wrapper",children:[e.jsx($,{className:"input-icon"}),e.jsx("input",{type:"tel",id:"phone",name:"phone",value:a.phone,onChange:l,className:`form-control ${r.phone?"is-invalid":""}`,placeholder:s("register.phonePlaceholder")})]}),r.phone&&e.jsx("div",{className:"invalid-feedback",children:r.phone}),e.jsx("small",{className:"form-text",children:s("register.phoneHelp")})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"password",children:s("register.passwordLabel")}),e.jsxs("div",{className:"input-icon-wrapper",children:[e.jsx(g,{className:"input-icon"}),e.jsx("input",{type:"password",id:"password",name:"password",value:a.password,onChange:l,className:`form-control ${r.password?"is-invalid":""}`,placeholder:s("register.passwordPlaceholder")})]}),r.password&&e.jsx("div",{className:"invalid-feedback",children:r.password}),e.jsx("small",{className:"form-text",children:s("register.passwordHelp")})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"confirmPassword",children:s("register.confirmPasswordLabel")}),e.jsxs("div",{className:"input-icon-wrapper",children:[e.jsx(g,{className:"input-icon"}),e.jsx("input",{type:"password",id:"confirmPassword",name:"confirmPassword",value:a.confirmPassword,onChange:l,className:`form-control ${r.confirmPassword?"is-invalid":""}`,placeholder:s("register.confirmPasswordPlaceholder")})]}),r.confirmPassword&&e.jsx("div",{className:"invalid-feedback",children:r.confirmPassword})]}),e.jsxs("div",{className:"form-group terms-checkbox",children:[e.jsxs("div",{className:`custom-checkbox ${r.agreeTerms?"is-invalid":""}`,children:[e.jsx("input",{type:"checkbox",id:"agreeTerms",name:"agreeTerms",checked:a.agreeTerms,onChange:l}),e.jsxs("label",{htmlFor:"agreeTerms",children:[s("register.termsLabel")," ",e.jsx(x,{to:"/terms",target:"_blank",rel:"noopener noreferrer",children:s("register.termsLinkText")})]})]}),r.agreeTerms&&e.jsx("div",{className:"invalid-feedback",children:r.agreeTerms})]}),e.jsx("button",{type:"submit",className:"btn-submit",disabled:o,children:s(o?"common.loading":"register.registerButton")})]}),e.jsx("div",{className:"auth-footer",children:e.jsxs("p",{children:[s("register.haveAccount")," ",e.jsx(x,{to:"/login",className:"auth-link",children:s("register.loginNow")})]})})]}),e.jsxs("div",{className:"auth-benefits",children:[e.jsx("h2",{children:s("register.whyRegister")}),e.jsxs("ul",{children:[e.jsx("li",{children:s("register.benefit1")}),e.jsx("li",{children:s("register.benefit2")}),e.jsx("li",{children:s("register.benefit3")}),e.jsx("li",{children:s("register.benefit4")})]})]})]})]})};export{E as default};
