import{u as g,k as U,s as k,$ as R,a as v,r as h,ai as F,aj as C,ak as D,j as s,al as l,y as z,f as m,am as j,an as E,ao as G,ap as x,a5 as p,e as P}from"./index-CEw6XCQe.js";import{t as u}from"./date-DCUNxNu2.js";const S=a=>(a==null?void 0:a.role)==="admin",T=()=>{const{t:a}=g(),t=v();return s.jsxs("div",{className:"admin-unauthorized",children:[s.jsx("h1",{children:a("admin.unauthorized.title","Unauthorized Access")}),s.jsx("p",{children:a("admin.unauthorized.message","You do not have permission to access the admin dashboard.")}),s.jsx("button",{onClick:()=>t("/"),children:a("common.backToHome","Back to Home")})]})},Z=()=>{const{t:a,i18n:t}=g(),b=U(k);R(),v(),h.useEffect(()=>{t.language!=="az"&&t.changeLanguage("az")},[t]);const{data:n,isLoading:N,isError:w,error:r,refetch:c}=F(void 0,{refetchOnMountOrArgChange:!1,refetchOnFocus:!1,refetchOnReconnect:!1}),[A,{isLoading:O}]=C(),[y,{isLoading:H}]=D();h.useEffect(()=>{n||c()},[n,c]);const f=async e=>{try{await A(e).unwrap()}catch(d){console.error("Failed to approve listing:",d)}},L=async e=>{try{await y({id:e}).unwrap()}catch(d){console.error("Failed to reject listing:",d)}};if(!S(b))return s.jsx(T,{});if(N)return s.jsx(l,{children:s.jsxs("div",{className:"dashboard-loading",children:[s.jsx(z,{}),s.jsx("p",{children:a("admin.dashboard.loading","Loading dashboard data...")})]})});if(w||!n)return s.jsx(l,{children:s.jsxs("div",{className:"dashboard-error",children:[s.jsx(m,{size:48}),s.jsx("h2",{children:a("admin.dashboard.error","Error loading dashboard")}),s.jsx("p",{children:(r==null?void 0:r.toString())||a("admin.dashboard.tryAgain","Please try again later")}),s.jsx("button",{onClick:()=>c(),className:"retry-button",children:a("admin.dashboard.retry","Retry")})]})});const i={totalUsers:n.totalUsers||{count:0},totalListings:n.totalListings||{count:0},pendingListings:n.pendingListings||[],activeCategories:n.activeCategories||{},userGrowth:n.userGrowth||0,listingGrowth:n.listingGrowth||0,recentActivity:n.recentActivity||[],totalRevenue:n.totalRevenue||0},o=e=>e===void 0?"₼0":new Intl.NumberFormat("az-AZ",{style:"currency",currency:"AZN",minimumFractionDigits:0,maximumFractionDigits:0}).format(e).replace("AZN","₼ ");return s.jsx(l,{children:s.jsxs("div",{className:"admin-dashboard",children:[s.jsxs("div",{className:"dashboard-header",children:[s.jsx("h1",{children:a("admin.dashboard.welcome","Welcome to Admin Dashboard")}),s.jsx("p",{children:a("admin.dashboard.overview","Here's an overview of your marketplace")})]}),s.jsxs("div",{className:"stats-cards",children:[s.jsxs("div",{className:"stat-card",children:[s.jsx("div",{className:"stat-icon users",children:s.jsx(j,{})}),s.jsxs("div",{className:"stat-content",children:[s.jsx("h3",{children:a("admin.dashboard.totalUsers","Total Users")}),s.jsx("p",{className:"stat-value",children:i.totalUsers.count}),s.jsxs("p",{className:"stat-change",children:["+",i.userGrowth," ",a("admin.dashboard.today","today")]})]})]}),s.jsxs("div",{className:"stat-card",children:[s.jsx("div",{className:"stat-icon listings",children:s.jsx(E,{})}),s.jsxs("div",{className:"stat-content",children:[s.jsx("h3",{children:a("admin.dashboard.totalListings","Total Listings")}),s.jsx("p",{className:"stat-value",children:i.totalListings.count}),s.jsxs("p",{className:"stat-change",children:["+",i.listingGrowth," ",a("admin.dashboard.today","today")]})]})]}),s.jsxs("div",{className:"stat-card",children:[s.jsx("div",{className:"stat-icon revenue",children:s.jsx(G,{})}),s.jsxs("div",{className:"stat-content",children:[s.jsx("h3",{children:a("admin.dashboard.totalRevenue","Total Revenue")}),s.jsx("p",{className:"stat-value",children:o(i.totalRevenue)})]})]}),s.jsxs("div",{className:"stat-card",children:[s.jsx("div",{className:"stat-icon pending",children:s.jsx(x,{})}),s.jsxs("div",{className:"stat-content",children:[s.jsx("h3",{children:a("admin.dashboard.pendingListings","Pending Listings")}),s.jsx("p",{className:"stat-value",children:i.pendingListings.length})]})]})]}),s.jsxs("div",{className:"dashboard-grid",children:[s.jsxs("div",{className:"dashboard-card recent-users",children:[s.jsxs("div",{className:"card-header",children:[s.jsxs("h2",{children:[s.jsx(j,{}),a("admin.dashboard.recentUsers","Recent Users")]}),s.jsxs("button",{className:"view-all-button",children:[s.jsx(p,{}),a("admin.dashboard.viewAll","View All")]})]}),s.jsx("div",{className:"card-content",children:i.recentActivity.length>0?s.jsxs("table",{className:"data-table",children:[s.jsx("thead",{children:s.jsxs("tr",{children:[s.jsx("th",{children:a("admin.dashboard.name","Name")}),s.jsx("th",{children:a("admin.dashboard.email","Email")}),s.jsx("th",{children:a("admin.dashboard.role","Role")}),s.jsx("th",{children:a("admin.dashboard.joined","Joined")})]})}),s.jsx("tbody",{children:i.recentActivity.map(e=>s.jsxs("tr",{children:[s.jsx("td",{children:e.user||"Unknown"}),s.jsx("td",{children:e.email||"Unknown"}),s.jsx("td",{children:s.jsx("span",{className:`role-badge ${e.role}`,children:e.role})}),s.jsx("td",{children:e.timestamp?u(new Date(e.timestamp)):a("common.unknown","Unknown")})]},e.id))})]}):s.jsx("div",{className:"empty-state",children:s.jsx("p",{children:a("admin.dashboard.noRecentUsers","No recent users to display")})})})]}),s.jsxs("div",{className:"dashboard-card pending-approvals",children:[s.jsxs("div",{className:"card-header",children:[s.jsxs("h2",{children:[s.jsx(x,{}),a("admin.dashboard.pendingApprovals","Pending Approvals")]}),s.jsxs("button",{className:"view-all-button",children:[s.jsx(p,{}),a("admin.dashboard.viewAll","View All")]})]}),s.jsx("div",{className:"card-content",children:i.pendingListings.length>0?s.jsx("div",{className:"pending-listings",children:i.pendingListings.map(e=>{var d;return s.jsxs("div",{className:"pending-item",children:[s.jsx("div",{className:"pending-item-image",children:s.jsx("img",{src:((d=e.images)==null?void 0:d[0])||"/placeholder-image.jpg",alt:e.title||"Untitled"})}),s.jsxs("div",{className:"pending-item-details",children:[s.jsx("h3",{children:e.title||"Untitled"}),s.jsx("p",{className:"item-price",children:o(e.price)}),s.jsxs("p",{className:"item-seller",children:[a("admin.dashboard.by","by")," ",e.user||"Unknown"]}),s.jsx("p",{className:"item-date",children:e.createdAt?u(new Date(e.createdAt)):a("common.unknown","Unknown")})]}),s.jsxs("div",{className:"pending-item-actions",children:[s.jsxs("button",{className:"approve-button",onClick:()=>f(e.id),children:[s.jsx(P,{}),a("admin.dashboard.approve","Approve")]}),s.jsxs("button",{className:"reject-button",onClick:()=>L(e.id),children:[s.jsx(m,{}),a("admin.dashboard.reject","Reject")]})]})]},e.id)})}):s.jsx("div",{className:"empty-state",children:s.jsx("p",{children:a("admin.dashboard.noPendingApprovals","No pending approvals")})})})]})]})]})})};export{Z as default};
