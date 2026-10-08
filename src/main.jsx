import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import leaf from './assets/leaf.svg';
import './styles.css';
function App(){
 const [path,setPath]=useState(location.pathname),[chunk,setChunk]=useState('waiting'),[config,setConfig]=useState('waiting');
 const basename=import.meta.env.VITE_ROUTER_BASENAME||'/';
 const route=path.startsWith(basename)?'/'+path.slice(basename.length):'outside-base';
 useEffect(()=>{const pop=()=>setPath(location.pathname);addEventListener('popstate',pop);import('./chunk.js').then(m=>setChunk(m.label)).catch(()=>setChunk('failed'));fetch(import.meta.env.BASE_URL+'config.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(x=>setConfig(x.fixture)).catch(()=>setConfig('failed'));return()=>removeEventListener('popstate',pop);},[]);
 const nav=e=>{e.preventDefault();history.pushState({},'',e.currentTarget.href);setPath(location.pathname);};
 const known=route==='/'||route==='/about/nested';
 return <main><p>Original MIT fixture · local laboratory</p><h1>{known?'Routing fixture ready':'Route not found'}</h1><nav><a href={basename} onClick={nav}>Home</a><a href={basename+'about/nested'} onClick={nav}>Nested route</a></nav><p data-route>{route}</p><img src={leaf} width="72" height="72" alt="Leaf illustration"/><p data-chunk>{chunk}</p><p data-config>{config}</p><p data-basename>{basename}</p><p data-base>{import.meta.env.BASE_URL}</p><p>No API, credentials, production writes or automatic push deployment.</p></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
