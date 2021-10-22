#!/bin/sh
source ./.env
export $TOKEN
export $URL

curl -o ./_data/current-waivers.json --location --request GET "$URL&select=state,data.requestStatus,data.psc,data.postSolicitationContainer.procurementTitle,data.contractingOfficeAgencyName,data.contractingOfficeAgencyId,data.fundingAgencyId,data.fundingAgencyName,data.procurementStage,data.naics,data.summaryOfProcurement,data.waiverRationaleSummary,data.sourcesSoughtOrRfiIssued,data.expectedMaximumDurationOfTheRequestedWaiver,data.isPricePreferenceIncluded,created,modified,data.ombDetermination,data.conditionsApplicableToConsistencyDetermination" \
--header "x-token: $TOKEN"
