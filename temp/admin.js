"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.auth = exports.app = void 0;
exports.initializeAdminApp = initializeAdminApp;
exports.getAdminAuth = getAdminAuth;
exports.getAdminFirestore = getAdminFirestore;
// Firebase admin-side configuration (for server components and API routes)
var admin = __importStar(require("firebase-admin"));
var firebase_service_account_json_1 = __importDefault(require("../../../firebase-service-account.json"));
// Global variables to store the Firebase Admin instances
var app;
var auth;
var db;
// Track initialization state
var isInitialized = false;
/**
 * Initialize the Firebase Admin SDK
 * This function is safe to call multiple times - it will only initialize once
 *
 * @returns An object containing the Firebase Admin app, auth, and db instances
 */
function initializeAdminApp() {
    // If already initialized, return existing instances
    if (isInitialized) {
        return { app: app, auth: auth, db: db };
    }
    // If apps already exist, use the first one
    if (admin.apps.length > 0) {
        exports.app = app = admin.apps[0];
        exports.auth = auth = admin.auth(app);
        exports.db = db = admin.firestore(app);
        isInitialized = true;
        return { app: app, auth: auth, db: db };
    }
    try {
        console.log('Firebase Admin: Starting initialization...');
        console.log('Firebase Admin: Service account project ID:', firebase_service_account_json_1.default.project_id);
        // Initialize Firebase Admin
        var firebaseAdminConfig = {
            credential: admin.credential.cert(firebase_service_account_json_1.default),
            projectId: firebase_service_account_json_1.default.project_id,
        };
        console.log('Firebase Admin config:', {
            projectId: firebaseAdminConfig.projectId,
            credentialType: 'service_account'
        });
        // Initialize the app
        exports.app = app = admin.initializeApp(firebaseAdminConfig);
        console.log('Firebase Admin: App initialized:', app.name);
        exports.auth = auth = admin.auth(app);
        console.log('Firebase Admin: Auth initialized');
        exports.db = db = admin.firestore(app);
        console.log('Firebase Admin: Firestore initialized');
        // Configure Firestore settings to optimize performance
        db.settings({
            ignoreUndefinedProperties: true,
        });
        isInitialized = true;
        console.log('Firebase Admin initialized successfully');
        return { app: app, auth: auth, db: db };
    }
    catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        throw error;
    }
}
// Create fallback implementations for use in environments where Firebase Admin can't be initialized
var createFallbackFirestore = function () {
    console.log('Creating fallback Firestore instance for error recovery');
    return {
        collection: function (collectionPath) {
            console.log("Fallback Firestore: Accessing collection ".concat(collectionPath));
            return {
                doc: function (docId) {
                    console.log("Fallback Firestore: Accessing document ".concat(collectionPath, "/").concat(docId));
                    return {
                        get: function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                console.log("Fallback Firestore: Getting document ".concat(collectionPath, "/").concat(docId));
                                return [2 /*return*/, {
                                        exists: false,
                                        id: docId,
                                        data: function () { return ({}); },
                                    }];
                            });
                        }); },
                        set: function (data) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                console.log("Fallback Firestore: Setting document ".concat(collectionPath, "/").concat(docId), data);
                                return [2 /*return*/];
                            });
                        }); },
                        update: function (data) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                console.log("Fallback Firestore: Updating document ".concat(collectionPath, "/").concat(docId), data);
                                return [2 /*return*/];
                            });
                        }); },
                    };
                },
                where: function () { return ({ where: function () { return ({ get: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ({ docs: [] })];
                        }); }); } }); } }); },
                orderBy: function () { return ({ limit: function () { return ({ get: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ({ docs: [] })];
                        }); }); } }); } }); },
                limit: function () { return ({ get: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, ({ docs: [] })];
                    }); }); } }); },
                get: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, ({ docs: [], empty: true, size: 0 })];
                }); }); },
            };
        },
        settings: function (settings) {
            console.log('Fallback Firestore: Setting settings', settings);
        },
        batch: function () { return ({
            set: function () { },
            update: function () { },
            delete: function () { },
            commit: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); },
        }); },
    };
};
// Only initialize Firebase Admin once at module load time
// This prevents multiple initializations across API routes
if (typeof window === 'undefined') { // Only run on server
    try {
        console.log('Initializing Firebase Admin SDK...');
        console.log('Service account project ID:', firebase_service_account_json_1.default.project_id);
        console.log('Environment project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
        // Initialize the admin app
        var _a = initializeAdminApp(), initializedApp = _a.app, initializedAuth = _a.auth, initializedDb = _a.db;
        exports.app = app = initializedApp;
        exports.auth = auth = initializedAuth;
        exports.db = db = initializedDb;
        console.log('Firebase Admin SDK initialized successfully');
        console.log('Admin app name:', app.name);
        console.log('Firestore instance:', !!db);
    }
    catch (error) {
        console.error('Error in initial Firebase Admin initialization:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
        exports.app = app = {};
        exports.auth = auth = {};
        exports.db = db = createFallbackFirestore();
    }
}
// Export a function to get the auth instance to prevent direct imports of getAuth
function getAdminAuth() {
    if (!isInitialized) {
        initializeAdminApp();
    }
    return auth;
}
// Export a function to get the firestore instance to prevent direct imports of getFirestore
function getAdminFirestore() {
    try {
        console.log('Admin Firestore: Getting Firestore instance');
        console.log('Admin Firestore: isInitialized:', isInitialized);
        console.log('Admin Firestore: db exists:', !!db);
        console.log('Admin Firestore: db type:', typeof db);
        if (!isInitialized) {
            console.log('Admin Firestore: Initializing admin app');
            initializeAdminApp();
        }
        if (!db) {
            console.error('Admin Firestore: DB instance is null or undefined after initialization');
            throw new Error('Failed to initialize Firestore admin instance');
        }
        console.log('Admin Firestore: Returning Firestore instance:', !!db);
        return db;
    }
    catch (error) {
        console.error('Admin Firestore: Error getting admin Firestore instance:', error);
        console.error('Admin Firestore: Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Admin Firestore: Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
        // Return fallback Firestore instance
        return createFallbackFirestore();
    }
}
