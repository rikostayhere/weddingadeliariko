const website="https://weddingrikoadel.my.id/";

const template=`_Assalamualaikum Warahmatullahi Wabarakaatuh_

Yth. {tamu}

Dengan memohon rahmat dan ridho Allah SWT,
perkenankan kami mengundang Saudara untuk menghadiri acara pernikahan kami.

🧕🏻 *Adelia Arifanti*

dengan

🤵🏻 *Riko Oktavian*

*Informasi lengkap dapat dilihat pada:*
{link}

Merupakan suatu kehormatan bagi kami apabila Saudara berkenan hadir dan memberikan doa restu.

_Wassalamualaikum Warahmatullahi Wabarakaatuh_

*Adel & Riko*`;

document
.getElementById("generateBtn")
.addEventListener("click",generate);

function generate(){

const list=document
.getElementById("guestList")
.value
.trim()
.split(/\n+/);

const result=document
.getElementById("result");

result.innerHTML="";

list.forEach(item=>{

let[nama,nomor=""]=item.split(",");

nama=nama.trim();

nomor=nomor.trim();

if(!nama)return;

let invite=
website+"?to="+encodeURIComponent(nama);

let pesan=
template
.replace("{tamu}",nama)
.replace("{link}",invite);

let wa=
(nomor
?"https://wa.me/"+formatNomor(nomor)
:"https://wa.me/")
+"?text="+encodeURIComponent(pesan);

result.innerHTML+=`
<div class="card">

<h3>${nama}</h3>

<p><strong>Undangan</strong></p>

<a href="${invite}" target="_blank">${invite}</a>

<p><strong>WhatsApp</strong></p>

<a href="${wa}" target="_blank">Buka WhatsApp</a>

<button onclick="copyText('${wa}')">
Salin Link WA
</button>

</div>
`;

});

}

function formatNomor(n){

n=n.replace(/\D/g,"");

if(n.startsWith("0"))
n="62"+n.slice(1);

return n;

}

function copyText(text){

navigator.clipboard.writeText(text);

alert("Link berhasil disalin");

}