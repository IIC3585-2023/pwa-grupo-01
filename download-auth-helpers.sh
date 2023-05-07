cd src
mkdir -p __/auth
cd __/auth

proyect="pwgag-eed34"

curl -O "https://$proyect.firebaseapp.com/__/auth/handler"
curl -O "https://$proyect.firebaseapp.com/__/auth/handler.js"
curl -O "https://$proyect.firebaseapp.com/__/auth/experiments.js"
curl -O "https://$proyect.firebaseapp.com/__/auth/iframe"
curl -O "https://$proyect.firebaseapp.com/__/auth/iframe.js"
