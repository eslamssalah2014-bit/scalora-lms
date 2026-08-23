"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coursePricingService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class CoursePricingService {
    storageFile;
    pricingMap = new Map();
    constructor() {
        const dataDir = path_1.default.resolve(process.cwd(), 'data');
        if (!fs_1.default.existsSync(dataDir)) {
            try {
                fs_1.default.mkdirSync(dataDir, { recursive: true });
            }
            catch { }
        }
        this.storageFile = path_1.default.join(dataDir, 'course_pricing.json');
        this.loadData();
    }
    loadData() {
        try {
            if (fs_1.default.existsSync(this.storageFile)) {
                const raw = fs_1.default.readFileSync(this.storageFile, 'utf-8');
                const parsed = JSON.parse(raw);
                if (typeof parsed === 'object' && parsed !== null) {
                    Object.entries(parsed).forEach(([courseId, record]) => {
                        this.pricingMap.set(courseId, {
                            courseId,
                            basePrice: Number(record.basePrice) || 0,
                            discountPrice: Number(record.discountPrice) || 0,
                            discountPercent: Number(record.discountPercent) || 0,
                            currency: record.currency || 'EGP',
                            updatedAt: record.updatedAt || new Date().toISOString(),
                        });
                    });
                }
                console.log(`[CoursePricing] Loaded custom pricing records for ${this.pricingMap.size} courses.`);
            }
            else {
                this.saveData();
            }
        }
        catch (err) {
            console.warn('[CoursePricing] Error loading pricing store:', err);
        }
    }
    saveData() {
        try {
            const obj = {};
            this.pricingMap.forEach((val, key) => {
                obj[key] = val;
            });
            fs_1.default.writeFileSync(this.storageFile, JSON.stringify(obj, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('[CoursePricing] Failed to save pricing store:', err);
        }
    }
    /**
     * Get pricing details for a course with fallback logic
     */
    getPricing(courseId, fallbackPrice = 0) {
        const existing = this.pricingMap.get(courseId);
        if (existing) {
            const effectiveDiscount = existing.discountPrice > 0 && existing.discountPrice < existing.basePrice
                ? existing.discountPrice
                : existing.basePrice;
            const discountPercent = existing.basePrice > 0 && effectiveDiscount < existing.basePrice
                ? Math.round(((existing.basePrice - effectiveDiscount) / existing.basePrice) * 100)
                : 0;
            return {
                ...existing,
                discountPercent,
            };
        }
        // Default: If course has a price in DB, use it as both base and discounted price
        const basePrice = fallbackPrice > 0 ? fallbackPrice : 0;
        return {
            courseId,
            basePrice,
            discountPrice: basePrice,
            discountPercent: 0,
            currency: 'EGP',
            updatedAt: new Date().toISOString(),
        };
    }
    /**
     * Set and validate custom course pricing
     */
    setPricing(courseId, basePriceInput, discountPriceInput) {
        const basePrice = Math.max(0, Number(basePriceInput) || 0);
        let discountPrice = discountPriceInput !== undefined && discountPriceInput !== null
            ? Math.max(0, Number(discountPriceInput))
            : basePrice;
        // Validation rule: Discounted price cannot be greater than base price
        if (discountPrice > basePrice) {
            discountPrice = basePrice;
        }
        const discountPercent = basePrice > 0 && discountPrice < basePrice
            ? Math.round(((basePrice - discountPrice) / basePrice) * 100)
            : 0;
        const record = {
            courseId,
            basePrice,
            discountPrice,
            discountPercent,
            currency: 'EGP',
            updatedAt: new Date().toISOString(),
        };
        this.pricingMap.set(courseId, record);
        this.saveData();
        return record;
    }
    /**
     * Get all custom course pricings
     */
    getAllPricings() {
        return this.pricingMap;
    }
}
exports.coursePricingService = new CoursePricingService();
