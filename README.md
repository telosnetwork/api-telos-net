
## Telos Kitchen SMS Account Creator
Web services for creating free Telos accounts by verifying SMS number.

### Step 1: Request Verification
This request will send an SMS one-time passcode (Telos Enrollment Code) to the SMS number provided. 
```
curl -X POST \
  https://opqeierg9e.execute-api.us-east-1.amazonaws.com/dev/register \
  -H 'x-api-key: ABK19jhYsW12Wny6LglV895szlG2QtOHang93J1T' \
  -d '{
	"smsNumber": "<smsNumber>"
}  '
```

### Step 2: Provide Telos Enrollment Code and Account Details
This request confirms the enrollment code and creates the account based on the account name and the provided keys. 

```
curl -X POST \
  https://opqeierg9e.execute-api.us-east-1.amazonaws.com/dev/create \
  -H 'x-api-key: ABK19jhYsW12Wny6LglV895szlG2QtOHang93J1T' \
  -d '{
    "smsNumber": "<smsNumber>",
    "smsOtp": "<telosEnrollmentCode>",
    "eosioAccount": "<requestedAccountName>",
    "ownerKey": "EOS6YK2nm32KPtojJ8YziNMhU3Tmk3wt3czXTbehtrUyEiyUvub4Y",
    "activeKey": "EOS6YK2nm32KPtojJ8YziNMhU3Tmk3wt3czXTbehtrUyEiyUvub4Y"
}'
```

NOTE: The services can receive ```eosioAccount```, ```ownerKey```, and ```activeKey``` as parameters in either request.

## TODO
- Enable integration with Google Firebase
- Add service to check if Telos account name is available
- Enable support for Dapps to fund account creation and service hosting using TLOS 
- Add additional security, such as JWT
- Host at custom domain