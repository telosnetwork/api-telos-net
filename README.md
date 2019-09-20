
curl -X POST \
  https://opqeierg9e.execute-api.us-east-1.amazonaws.com/dev/create \
  -H 'x-api-key: ABK19jhYsW12Wny6LglV895szlG2QtOHang93J1T' \
  -d '{
    "smsNumber": "+19196738460",
    "smsOtp": "414904"
}'


curl -X POST \
  https://opqeierg9e.execute-api.us-east-1.amazonaws.com/dev/register \
  -H 'x-api-key: ABK19jhYsW12Wny6LglV895szlG2QtOHang93J1T' \
  -d '{
	"smsNumber": "+19196738460",
	"eosioAccount": "newtelosa5ct",
    "ownerKey": "EOS6YK2nm32KPtojJ8YziNMhU3Tmk3wt3czXTbehtrUyEiyUvub4Y",
    "activeKey": "EOS6YK2nm32KPtojJ8YziNMhU3Tmk3wt3czXTbehtrUyEiyUvub4Y"
}  '