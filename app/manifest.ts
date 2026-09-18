import type { MetadataRoute } from 'next'
export default function manifest():MetadataRoute.Manifest{return{name:'DH Manager',short_name:'DH Manager',start_url:'/',display:'standalone',background_color:'#03070b',theme_color:'#0787ff',icons:[{src:'/dh-agency-logo.jpeg',sizes:'any',type:'image/jpeg'}]}}
