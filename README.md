
## Telos Kitchen SMS Account Creator
Web services for creating free Telos accounts by verifying SMS number.

## TODO
- [ ] Enable Sentry config / move DSN to ENV VARS
- [ ] Enable integration with Google Firebase
- [ ] Enable support for Dapps to fund account creation and service hosting using TLOS 
- [ ] Add additional security, such as JWT


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

## Utilities

### Account Exists Checker
Clients can use this web service to check if Telos accounts exist or not. This endpoint does not require the API key. 

```
curl \
https://opqeierg9e.execute-api.us-east-1.amazonaws.com/dev/exists\?accountName\=teloskitchen
```

The response contains an attribute for ```exists```, which is either true or false.

Account exists:
```
{
    "accountName": "teloskitchen",
    "exists": true,
    "success": "true"
}
```

Account does not exist:
```
{
    "accountName": "sdskflsdj",
    "exists": false,
    "success": "true"
}
```

### Key Pair Generator
It is recommended that clients use a local library to generate key pairs and pass the public key to one of the services above. However, clients may use a service that we provide. 

```
curl https://opqeierg9e.execute-api.us-east-1.amazonaws.com/dev/keygen
```

Reponse: 
```
{
    "message": "See attached keys",
    "keys": [
        {
            "privateKey": "5KgsJreyJVpBjFoodRknUCCmT4hfwAUgqKuTBX7jyHTEQVmWD14",
            "publicKey": "EOS7nMV7tMd4CUFJyuTbGgumkK9xW9KNb8Sr6gf28uSyJnci7gSw5"
        },
        {
            "privateKey": "5HrogJdmrhCdkEASJU1n4asUsbVwWAp9nTW5P8eECHMQ1uK9X3B",
            "publicKey": "EOS6aM5QsbnAFqm52tAPwSjSs5oBqXvDFQuGDD6gFEQWP6SU2N8be"
        }
    ],
    "success": "true"
}
```

#### Option: numKeys
The default number of keys to generate is two (2).  A client can pass an optional query string parameter ```numKeys``` to generate more or less.

```
curl https://opqeierg9e.execute-api.us-east-1.amazonaws.com/dev/keygen\?numKeys\=4
```

Four keys in ```keys``` array in response:
```
{
    "message": "See attached keys",
    "keys": [
        {
            "privateKey": "5KkgP3jP2VNpZHwhqmXZa6mUdq9MF5pHv2858nikQCcRX9yuPVE",
            "publicKey": "EOS7ZQSdPv2uyRzzNp3ZpZngwq2BeKt3z6H3RQDjt8SRXLXs17WbM"
        },
        {
            "privateKey": "5K41ewbZiDRDtExyX3ZLqCScStAFoNpn64MrhFVtmoyzkA43iZm",
            "publicKey": "EOS5cA4gty7RXtJurPauKJdccfRzd2kJ7QsoAv9SCZipP5dxH6ocK"
        },
        {
            "privateKey": "5Kidxxmnb5toHuHPmR6xSNyeWhURptuUoPe4g5D6uaNuxdD63Qo",
            "publicKey": "EOS82ofhJX16rVsJKmidJKyySxDzCRQQUJPa7KwgRweZgKPCJD14m"
        },
        {
            "privateKey": "5Jp96GHAgn6TLpeHYyreS2GeENjiiGHooXhjAnd3V6SYBBcuD6d",
            "publicKey": "EOS7ZoPK65KZzJze7qrDeWPA81E5aKsfywa7pdgrqH8oHLZ9Bwbk3"
        }
    ],
    "success": "true"
}
```
