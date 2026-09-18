import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
 return {name:'DH Manager',short_name:'DH Manager',description:'DH Agency Operations Manager',start_url:'/',display:'standalone',background_color:'#050706',theme_color:'#1fbd61',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png'}]}
}
