import{u as w,i as k,b as P,f as c,k as y,n as T,r as h,j as e,L as p,p as L}from"./index-5xEUM_gm.js";import{H as F}from"./index.esm-5bBGV7pT.js";const C=()=>{const{t:s}=w(),g=k(),f=P(),n=c(y),m=c(T),[r,x]=h.useState({firstName:"",lastName:"",email:"",phone:"",password:"",confirmPassword:"",agreeTerms:!1}),[a,d]=h.useState({}),l=i=>{const{name:t,value:j,type:v,checked:b}=i.target;x(o=>({...o,[t]:v==="checkbox"?b:j})),a[t]&&d(o=>({...o,[t]:void 0}))},N=()=>{const i={};return r.firstName.trim()||(i.firstName=s("register.firstNameRequired")),r.lastName.trim()||(i.lastName=s("register.lastNameRequired")),r.email.trim()?/\S+@\S+\.\S+/.test(r.email)||(i.email=s("register.emailInvalid")):i.email=s("register.emailRequired"),r.phone&&!/^\+?\d{10,15}$/.test(r.phone.replace(/\s/g,""))&&(i.phone=s("register.phoneInvalid")),r.password?r.password.length<8&&(i.password=s("register.passwordTooShort")):i.password=s("register.passwordRequired"),r.password!==r.confirmPassword&&(i.confirmPassword=s("register.passwordsDoNotMatch")),r.agreeTerms||(i.agreeTerms=s("register.termsRequired")),d(i),Object.keys(i).length===0},u=async i=>{if(i.preventDefault(),!!N())try{await g(L({firstName:r.firstName,lastName:r.lastName,email:r.email,phone:r.phone,password:r.password})).unwrap(),f("/login?registered=true")}catch(t){console.error("Registration failed:",t)}};return e.jsxs("div",{className:"register-page",children:[e.jsxs(F,{children:[e.jsxs("title",{children:[s("register.pageTitle")," | Mart.az"]}),e.jsx("meta",{name:"description",content:s("register.metaDescription")})]}),e.jsxs("div",{className:"register-container",children:[e.jsxs("div",{className:"auth-form-container",children:[e.jsx("h1",{className:"auth-title",children:s("register.title")}),e.jsx("p",{className:"auth-subtitle",children:s("register.subtitle")}),m&&e.jsx("div",{className:"alert alert-danger",role:"alert",children:m}),e.jsxs("form",{onSubmit:u,className:"auth-form",children:[e.jsxs("div",{className:"form-row",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"firstName",children:s("register.firstNameLabel")}),e.jsx("input",{type:"text",id:"firstName",name:"firstName",value:r.firstName,onChange:l,className:`form-control ${a.firstName?"is-invalid":""}`,placeholder:s("register.firstNamePlaceholder")}),a.firstName&&e.jsx("div",{className:"invalid-feedback",children:a.firstName})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"lastName",children:s("register.lastNameLabel")}),e.jsx("input",{type:"text",id:"lastName",name:"lastName",value:r.lastName,onChange:l,className:`form-control ${a.lastName?"is-invalid":""}`,placeholder:s("register.lastNamePlaceholder")}),a.lastName&&e.jsx("div",{className:"invalid-feedback",children:a.lastName})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"email",children:s("register.emailLabel")}),e.jsx("input",{type:"email",id:"email",name:"email",value:r.email,onChange:l,className:`form-control ${a.email?"is-invalid":""}`,placeholder:s("register.emailPlaceholder")}),a.email&&e.jsx("div",{className:"invalid-feedback",children:a.email})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"phone",children:s("register.phoneLabel")}),e.jsx("input",{type:"tel",id:"phone",name:"phone",value:r.phone,onChange:l,className:`form-control ${a.phone?"is-invalid":""}`,placeholder:s("register.phonePlaceholder")}),a.phone&&e.jsx("div",{className:"invalid-feedback",children:a.phone}),e.jsx("small",{className:"form-text text-muted",children:s("register.phoneHelp")})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"password",children:s("register.passwordLabel")}),e.jsx("input",{type:"password",id:"password",name:"password",value:r.password,onChange:l,className:`form-control ${a.password?"is-invalid":""}`,placeholder:s("register.passwordPlaceholder")}),a.password&&e.jsx("div",{className:"invalid-feedback",children:a.password}),e.jsx("small",{className:"form-text text-muted",children:s("register.passwordHelp")})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"confirmPassword",children:s("register.confirmPasswordLabel")}),e.jsx("input",{type:"password",id:"confirmPassword",name:"confirmPassword",value:r.confirmPassword,onChange:l,className:`form-control ${a.confirmPassword?"is-invalid":""}`,placeholder:s("register.confirmPasswordPlaceholder")}),a.confirmPassword&&e.jsx("div",{className:"invalid-feedback",children:a.confirmPassword})]}),e.jsxs("div",{className:"form-group terms-checkbox",children:[e.jsxs("div",{className:`custom-checkbox ${a.agreeTerms?"is-invalid":""}`,children:[e.jsx("input",{type:"checkbox",id:"agreeTerms",name:"agreeTerms",checked:r.agreeTerms,onChange:l}),e.jsxs("label",{htmlFor:"agreeTerms",children:[s("register.termsLabel")," ",e.jsx(p,{to:"/terms",target:"_blank",rel:"noopener noreferrer",children:s("register.termsLinkText")})]})]}),a.agreeTerms&&e.jsx("div",{className:"invalid-feedback",children:a.agreeTerms})]}),e.jsx("button",{type:"submit",className:"btn btn-primary btn-block",disabled:n,children:s(n?"common.loading":"register.registerButton")})]}),e.jsx("div",{className:"auth-footer",children:e.jsxs("p",{children:[s("register.haveAccount")," ",e.jsx(p,{to:"/login",className:"auth-link",children:s("register.loginNow")})]})})]}),e.jsxs("div",{className:"auth-benefits",children:[e.jsx("h2",{children:s("register.whyRegister")}),e.jsxs("ul",{children:[e.jsx("li",{children:s("register.benefit1")}),e.jsx("li",{children:s("register.benefit2")}),e.jsx("li",{children:s("register.benefit3")}),e.jsx("li",{children:s("register.benefit4")})]})]})]})]})};export{C as default};
//# sourceMappingURL=index-Lg9hkIRT.js.map
