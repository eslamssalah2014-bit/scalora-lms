"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const kashier_service_js_1 = require("../services/kashier.service.js");
function runKashierVerificationTests() {
    console.log('🧪 [KASHIER TESTS] Starting Automated Signature & Webhook Verification Suite...');
    const testSecret = '9d87ac572bac0c3baa7f98d1cdda3fa2$0dda7a2099a6b41a096438e613ba03c38906c3cbe1de3aff6d87e12c3752f5ce6f05ec8cdf934bd08bb5750f9e5305bc';
    const testMid = 'MID-2026-SCALORA';
    const testOrderId = 'SCL-TEST-12345';
    const testAmount = 500;
    const testCurrency = 'EGP';
    // Test 1: Order Hash Calculation
    console.log('\n--- Test 1: Generate Order Hash ---');
    const generatedHash = kashier_service_js_1.kashierService.generateOrderHash({
        orderId: testOrderId,
        amount: testAmount,
        currency: testCurrency,
        mid: testMid,
    });
    const expectedPath = `/?payment=${testMid}.${testOrderId}.${testAmount.toFixed(2)}.${testCurrency}`;
    const manualHash = crypto_1.default.createHmac('sha256', testSecret).update(expectedPath).digest('hex');
    console.log('Path String:', expectedPath);
    console.log('Generated Hash:', generatedHash);
    console.log('Manual Hash:   ', manualHash);
    if (generatedHash === manualHash) {
        console.log('✅ Test 1 PASSED: Order hash correctly matches HMAC-SHA256 standard.');
    }
    else {
        throw new Error('❌ Test 1 FAILED: Order hash mismatch!');
    }
    // Test 2: Callback Signature Verification (Positive Case)
    console.log('\n--- Test 2: Verify Callback Signature (Valid) ---');
    const callbackParams = {
        paymentStatus: 'SUCCESS',
        orderId: testOrderId,
        amount: '500.00',
        currency: 'EGP',
        transactionId: 'TXN-KSH-9988',
        card: '411111****1111',
    };
    // Reconstruct callback query string
    let queryStr = '';
    for (const k of Object.keys(callbackParams)) {
        queryStr += `&${k}=${callbackParams[k]}`;
    }
    queryStr = queryStr.replace(/^&/, '');
    const callbackSignature = crypto_1.default.createHmac('sha256', testSecret).update(queryStr).digest('hex');
    callbackParams.signature = callbackSignature;
    const isCallbackValid = kashier_service_js_1.kashierService.verifyCallbackSignature(callbackParams);
    console.log('Callback Verification Result:', isCallbackValid);
    if (isCallbackValid) {
        console.log('✅ Test 2 PASSED: Valid callback signature confirmed.');
    }
    else {
        throw new Error('❌ Test 2 FAILED: Valid callback was falsely rejected!');
    }
    // Test 3: Callback Signature Verification (Tampered Case)
    console.log('\n--- Test 3: Reject Tampered Callback Signature ---');
    const tamperedParams = { ...callbackParams, amount: '10.00' }; // Tampered amount
    const isTamperedValid = kashier_service_js_1.kashierService.verifyCallbackSignature(tamperedParams);
    console.log('Tampered Verification Result (Must be false):', isTamperedValid);
    if (!isTamperedValid) {
        console.log('✅ Test 3 PASSED: Tampered callback successfully rejected.');
    }
    else {
        throw new Error('❌ Test 3 FAILED: Tampered callback was accepted!');
    }
    // Test 4: Webhook Signature Verification
    console.log('\n--- Test 4: Verify Webhook Signature ---');
    const webhookPayload = {
        event: 'pay',
        status: 'SUCCESS',
        orderId: testOrderId,
        amount: '500.00',
        signatureKeys: ['amount', 'event', 'orderId', 'status'],
    };
    const sortedKeys = [...webhookPayload.signatureKeys].sort();
    const dataToSign = sortedKeys
        .map((k) => `${k}=${encodeURIComponent(webhookPayload[k])}`)
        .join('&');
    const webhookSignature = crypto_1.default.createHmac('sha256', testSecret).update(dataToSign).digest('hex');
    const rawBody = Buffer.from(JSON.stringify(webhookPayload));
    const isWebhookValid = kashier_service_js_1.kashierService.verifyWebhookSignature(rawBody, webhookSignature);
    console.log('Webhook Verification Result:', isWebhookValid);
    if (isWebhookValid) {
        console.log('✅ Test 4 PASSED: Webhook signature verified successfully.');
    }
    else {
        throw new Error('❌ Test 4 FAILED: Valid webhook signature was rejected!');
    }
    console.log('\n🎉 ALL KASHIER VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}
runKashierVerificationTests();
