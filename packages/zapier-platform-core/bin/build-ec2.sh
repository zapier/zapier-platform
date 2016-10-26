# Usage like so:
# ./build-ec2.sh ec2-user@ip-10-5-40-104.ec2.internal ami.bundle.zip

echo "###### Uploading..."
echo ""
ssh $1 "mkdir -p /home/ec2-user/zapier-core-platform"
scp -rp package.json index.js src include bin $1:/home/ec2-user/zapier-core-platform
echo ""
echo ""
echo "###### Building..."
echo ""
ssh $1 "cd /home/ec2-user/zapier-core-platform && rm -rf node_modules"
ssh $1 "cd /home/ec2-user/zapier-core-platform && npm install --production"
echo ""
echo ""
echo "###### Zipping..."
echo ""
ssh $1 "cd /home/ec2-user/zapier-core-platform && bin/build.sh $2"
echo ""
echo ""
echo "###### Downloading..."
echo ""
scp -rp $1:/home/ec2-user/zapier-core-platform/$2 . 
echo ""
echo ""
echo "Done buiding! :-)"

node ./upload-lambda.js
