# ============================================
# UPDATE THESE TWO VALUES WITH YOUR SETTINGS
# ============================================
BUCKET="ai-agent-workshop-hp1397"        # e.g., ai-agent-workshop-123456789012
REGION="us-west-2"               # Your deployment region

# ============================================
# DO NOT MODIFY BELOW THIS LINE
# ============================================
# HTTPS URLs for CloudFormation templates (CFN requires HTTPS)
BASE_URL="https://${BUCKET}.s3.${REGION}.amazonaws.com"
# S3 URIs for asset files (Lambda uses S3 SDK to read from private buckets)
S3_URI="s3://${BUCKET}"

aws cloudformation create-stack \
  --stack-name ai-agent-workshop \
  --template-url "${BASE_URL}/templates/unified-workshop-stack.yaml" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --parameters \
    ParameterKey=AssetsBucketName,ParameterValue=${BUCKET} \
    ParameterKey=IndustryMode,ParameterValue=all \
    ParameterKey=CreateKnowledgeBase,ParameterValue=true \
    ParameterKey=CreateSharedApiKey,ParameterValue=true \
    ParameterKey=CreateAIAgents,ParameterValue=true \
    ParameterKey=CreateAgentCoreGateway,ParameterValue=true \
    ParameterKey=IsWorkshopStudioEnv,ParameterValue=no \
    ParameterKey=Boto3LayerS3Bucket,ParameterValue=${BUCKET} \
    ParameterKey=Boto3LayerS3Key,ParameterValue=boto3-layer.zip \
    ParameterKey=ConnectInstanceStackUrl,ParameterValue=${BASE_URL}/templates/connect-instance.yaml \
    ParameterKey=AssistantSetupStackUrl,ParameterValue=${BASE_URL}/templates/assistant-setup.yaml \
    ParameterKey=AssistantLoggingStackUrl,ParameterValue=${BASE_URL}/templates/assistant-logging.yaml \
    ParameterKey=InstanceAttributesStackUrl,ParameterValue=${BASE_URL}/templates/connect-instance-attributes.yaml \
    ParameterKey=AssistantKnowledgeBaseStackUrl,ParameterValue=${BASE_URL}/templates/assistant-knowledge-base.yaml \
    ParameterKey=AIAgentsStackUrl,ParameterValue=${BASE_URL}/templates/ai-agents-setup.yaml \
    ParameterKey=KnowledgeBaseZipUrl,ParameterValue=${S3_URI}/knowledge-base/all-industries-kb.zip \
    ParameterKey=AgentCoreGatewayStackUrl,ParameterValue=${BASE_URL}/templates/agentcore-gateway.yaml \
    ParameterKey=HotelApiStackUrl,ParameterValue=${BASE_URL}/templates/hotel-api.yaml \
    ParameterKey=HotelOpenApiSpecUrl,ParameterValue=${S3_URI}/hotel/hotel-api-openapi.yaml \
    ParameterKey=HotelSeedDataUrl,ParameterValue=${S3_URI}/hotel/hotel-seed-data.json \
    ParameterKey=HotelAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/hotel/hotel-agent-assist-prompt.yaml \
    ParameterKey=HotelSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/hotel/hotel-self-service-prompt.yaml \
    ParameterKey=BillingApiStackUrl,ParameterValue=${BASE_URL}/templates/billing-api.yaml \
    ParameterKey=BillingOpenApiSpecUrl,ParameterValue=${S3_URI}/billing/billing-api-openapi.yaml \
    ParameterKey=BillingSeedDataUrl,ParameterValue=${S3_URI}/billing/billing-seed-data.json \
    ParameterKey=BillingAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/billing/billing-agent-assist-prompt.yaml \
    ParameterKey=BillingSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/billing/billing-self-service-prompt.yaml \
    ParameterKey=FacilitiesApiStackUrl,ParameterValue=${BASE_URL}/templates/facilities-api.yaml \
    ParameterKey=FacilitiesOpenApiSpecUrl,ParameterValue=${S3_URI}/facilities/facilities-api-openapi.yaml \
    ParameterKey=FacilitiesSeedDataUrl,ParameterValue=${S3_URI}/facilities/facilities-seed-data.json \
    ParameterKey=FacilitiesAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/facilities/facilities-agent-assist-prompt.yaml \
    ParameterKey=FacilitiesSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/facilities/facilities-self-service-prompt.yaml \
    ParameterKey=PublicSectorApiStackUrl,ParameterValue=${BASE_URL}/templates/public-sector-api.yaml \
    ParameterKey=PublicSectorOpenApiSpecUrl,ParameterValue=${S3_URI}/public-sector/public-sector-api-openapi.yaml \
    ParameterKey=PublicSectorSeedDataUrl,ParameterValue=${S3_URI}/public-sector/public-sector-seed-data.json \
    ParameterKey=PublicSectorAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/public-sector/public-sector-agent-assist-prompt.yaml \
    ParameterKey=PublicSectorSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/public-sector/public-sector-self-service-prompt.yaml \
    ParameterKey=HealthcareApiStackUrl,ParameterValue=${BASE_URL}/templates/healthcare-api.yaml \
    ParameterKey=HealthcareOpenApiSpecUrl,ParameterValue=${S3_URI}/healthcare/healthcare-api-openapi.yaml \
    ParameterKey=HealthcareSeedDataUrl,ParameterValue=${S3_URI}/healthcare/healthcare-seed-data.json \
    ParameterKey=HealthcareAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/healthcare/healthcare-agent-assist-prompt.yaml \
    ParameterKey=HealthcareSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/healthcare/healthcare-self-service-prompt.yaml \
    ParameterKey=RetailApiStackUrl,ParameterValue=${BASE_URL}/templates/retail-api.yaml \
    ParameterKey=RetailOpenApiSpecUrl,ParameterValue=${S3_URI}/retail/retail-api-openapi.yaml \
    ParameterKey=RetailSeedDataUrl,ParameterValue=${S3_URI}/retail/retail-seed-data.json \
    ParameterKey=RetailAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/retail/retail-agent-assist-prompt.yaml \
    ParameterKey=RetailSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/retail/retail-self-service-prompt.yaml \
    ParameterKey=TelecomApiStackUrl,ParameterValue=${BASE_URL}/templates/telecom-api.yaml \
    ParameterKey=TelecomOpenApiSpecUrl,ParameterValue=${S3_URI}/telecom/telecom-api-openapi.yaml \
    ParameterKey=TelecomSeedDataUrl,ParameterValue=${S3_URI}/telecom/telecom-seed-data.json \
    ParameterKey=TelecomAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/telecom/telecom-agent-assist-prompt.yaml \
    ParameterKey=TelecomSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/telecom/telecom-self-service-prompt.yaml \
    ParameterKey=UtilitiesApiStackUrl,ParameterValue=${BASE_URL}/templates/utilities-api.yaml \
    ParameterKey=UtilitiesOpenApiSpecUrl,ParameterValue=${S3_URI}/utilities/utilities-api-openapi.yaml \
    ParameterKey=UtilitiesSeedDataUrl,ParameterValue=${S3_URI}/utilities/utilities-seed-data.json \
    ParameterKey=UtilitiesAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/utilities/utilities-agent-assist-prompt.yaml \
    ParameterKey=UtilitiesSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/utilities/utilities-self-service-prompt.yaml \
    ParameterKey=InsuranceApiStackUrl,ParameterValue=${BASE_URL}/templates/insurance-api.yaml \
    ParameterKey=InsuranceOpenApiSpecUrl,ParameterValue=${S3_URI}/insurance/insurance-api-openapi.yaml \
    ParameterKey=InsuranceSeedDataUrl,ParameterValue=${S3_URI}/insurance/insurance-seed-data.json \
    ParameterKey=InsuranceAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/insurance/insurance-agent-assist-prompt.yaml \
    ParameterKey=InsuranceSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/insurance/insurance-self-service-prompt.yaml \
    ParameterKey=AutomotiveApiStackUrl,ParameterValue=${BASE_URL}/templates/automotive-api.yaml \
    ParameterKey=AutomotiveOpenApiSpecUrl,ParameterValue=${S3_URI}/automotive/automotive-api-openapi.yaml \
    ParameterKey=AutomotiveSeedDataUrl,ParameterValue=${S3_URI}/automotive/automotive-seed-data.json \
    ParameterKey=AutomotiveAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/automotive/automotive-agent-assist-prompt.yaml \
    ParameterKey=AutomotiveSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/automotive/automotive-self-service-prompt.yaml \
    ParameterKey=ManufacturingApiStackUrl,ParameterValue=${BASE_URL}/templates/manufacturing-api.yaml \
    ParameterKey=ManufacturingOpenApiSpecUrl,ParameterValue=${S3_URI}/manufacturing/manufacturing-api-openapi.yaml \
    ParameterKey=ManufacturingSeedDataUrl,ParameterValue=${S3_URI}/manufacturing/manufacturing-seed-data.json \
    ParameterKey=ManufacturingAgentAssistPromptUrl,ParameterValue=${S3_URI}/ai-agents/manufacturing/manufacturing-agent-assist-prompt.yaml \
    ParameterKey=ManufacturingSelfServicePromptUrl,ParameterValue=${S3_URI}/ai-agents/manufacturing/manufacturing-self-service-prompt.yaml