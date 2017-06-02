ZAPIER_FILE='/home/travis/.zapierrc'
touch $ZAPIER_FILE
echo "{
  \"deployKey\": \"$ZAPIER_DEPLOY_KEY\"
}" > $ZAPIER_FILE