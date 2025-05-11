/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./src/contexts/AuthContext.js":
/*!*************************************!*\
  !*** ./src/contexts/AuthContext.js ***!
  \*************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AuthProvider: () => (/* binding */ AuthProvider),\n/* harmony export */   useAuth: () => (/* binding */ useAuth)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var firebase_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase/auth */ \"firebase/auth\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! firebase/firestore */ \"firebase/firestore\");\n/* harmony import */ var _lib_firebase__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../lib/firebase */ \"./src/lib/firebase.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! next/router */ \"./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_5__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([firebase_auth__WEBPACK_IMPORTED_MODULE_2__, firebase_firestore__WEBPACK_IMPORTED_MODULE_3__, _lib_firebase__WEBPACK_IMPORTED_MODULE_4__]);\n([firebase_auth__WEBPACK_IMPORTED_MODULE_2__, firebase_firestore__WEBPACK_IMPORTED_MODULE_3__, _lib_firebase__WEBPACK_IMPORTED_MODULE_4__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\n\n\nconst AuthContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)({});\nconst useAuth = ()=>(0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AuthContext);\nconst AuthProvider = ({ children })=>{\n    const [currentUser, setCurrentUser] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [userType, setUserType] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null); // 'aluno' ou 'admin'\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true);\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_5__.useRouter)();\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        const unsubscribe = (0,firebase_auth__WEBPACK_IMPORTED_MODULE_2__.onAuthStateChanged)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.auth, async (user)=>{\n            if (user) {\n                setCurrentUser(user);\n                // Verificar se o usuário é admin ou aluno\n                const userDoc = await (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.getDoc)((0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.doc)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.db, \"usuarios\", user.uid));\n                if (userDoc.exists()) {\n                    setUserType(userDoc.data().tipo);\n                }\n            } else {\n                setCurrentUser(null);\n                setUserType(null);\n            }\n            setLoading(false);\n        });\n        return unsubscribe;\n    }, []);\n    // Registro para alunos\n    const registerAluno = async (cpf, email, password)=>{\n        try {\n            const userCredential = await (0,firebase_auth__WEBPACK_IMPORTED_MODULE_2__.createUserWithEmailAndPassword)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.auth, email, password);\n            // Criar documento do usuário no Firestore\n            await (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.setDoc)((0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.doc)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.db, \"usuarios\", userCredential.user.uid), {\n                email,\n                cpf,\n                tipo: \"aluno\",\n                createdAt: new Date()\n            });\n            return userCredential.user;\n        } catch (error) {\n            throw error;\n        }\n    };\n    // Registro para admin (apenas admin pode criar outro admin)\n    const registerAdmin = async (email, password, nome)=>{\n        // Verificar se o usuário atual é admin\n        if (userType !== \"admin\") {\n            throw new Error(\"Apenas administradores podem criar novos administradores\");\n        }\n        try {\n            const userCredential = await (0,firebase_auth__WEBPACK_IMPORTED_MODULE_2__.createUserWithEmailAndPassword)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.auth, email, password);\n            // Criar documento do usuário no Firestore\n            await (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.setDoc)((0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.doc)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.db, \"usuarios\", userCredential.user.uid), {\n                email,\n                nome,\n                tipo: \"admin\",\n                createdAt: new Date()\n            });\n            return userCredential.user;\n        } catch (error) {\n            throw error;\n        }\n    };\n    // Login\n    const login = async (email, password)=>{\n        try {\n            const userCredential = await (0,firebase_auth__WEBPACK_IMPORTED_MODULE_2__.signInWithEmailAndPassword)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.auth, email, password);\n            // Redirecionar com base no tipo de usuário\n            const userDoc = await (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.getDoc)((0,firebase_firestore__WEBPACK_IMPORTED_MODULE_3__.doc)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.db, \"usuarios\", userCredential.user.uid));\n            if (userDoc.exists()) {\n                const tipo = userDoc.data().tipo;\n                router.push(tipo === \"admin\" ? \"/admin/dashboard\" : \"/aluno/dashboard\");\n            }\n            return userCredential.user;\n        } catch (error) {\n            throw error;\n        }\n    };\n    // Logout\n    const logout = async ()=>{\n        try {\n            await (0,firebase_auth__WEBPACK_IMPORTED_MODULE_2__.signOut)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.auth);\n            router.push(\"/\");\n        } catch (error) {\n            throw error;\n        }\n    };\n    // Recuperação de senha\n    const resetPassword = async (email)=>{\n        try {\n            await (0,firebase_auth__WEBPACK_IMPORTED_MODULE_2__.sendPasswordResetEmail)(_lib_firebase__WEBPACK_IMPORTED_MODULE_4__.auth, email);\n        } catch (error) {\n            throw error;\n        }\n    };\n    const value = {\n        currentUser,\n        userType,\n        registerAluno,\n        registerAdmin,\n        login,\n        logout,\n        resetPassword,\n        loading\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AuthContext.Provider, {\n        value: value,\n        children: !loading && children\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\EnokdaRocha\\\\OneDrive - ZIG Tecnologia S A\\\\\\xc1rea de Trabalho\\\\Projetos Pessoais\\\\breda\\\\avaliacao-fisica-app\\\\src\\\\contexts\\\\AuthContext.js\",\n        lineNumber: 135,\n        columnNumber: 5\n    }, undefined);\n};\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29udGV4dHMvQXV0aENvbnRleHQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQXVFO0FBT2hEO0FBQ2tDO0FBQ2Q7QUFDSDtBQUV4QyxNQUFNZSw0QkFBY2Ysb0RBQWFBLENBQUMsQ0FBQztBQUU1QixNQUFNZ0IsVUFBVSxJQUFNYixpREFBVUEsQ0FBQ1ksYUFBYTtBQUU5QyxNQUFNRSxlQUFlLENBQUMsRUFBRUMsUUFBUSxFQUFFO0lBQ3ZDLE1BQU0sQ0FBQ0MsYUFBYUMsZUFBZSxHQUFHbkIsK0NBQVFBLENBQUM7SUFDL0MsTUFBTSxDQUFDb0IsVUFBVUMsWUFBWSxHQUFHckIsK0NBQVFBLENBQUMsT0FBTyxxQkFBcUI7SUFDckUsTUFBTSxDQUFDc0IsU0FBU0MsV0FBVyxHQUFHdkIsK0NBQVFBLENBQUM7SUFDdkMsTUFBTXdCLFNBQVNYLHNEQUFTQTtJQUV4QlosZ0RBQVNBLENBQUM7UUFDUixNQUFNd0IsY0FBY2xCLGlFQUFrQkEsQ0FBQ0ksK0NBQUlBLEVBQUUsT0FBT2U7WUFDbEQsSUFBSUEsTUFBTTtnQkFDUlAsZUFBZU87Z0JBRWYsMENBQTBDO2dCQUMxQyxNQUFNQyxVQUFVLE1BQU1qQiwwREFBTUEsQ0FBQ0YsdURBQUdBLENBQUNJLDZDQUFFQSxFQUFFLFlBQVljLEtBQUtFLEdBQUc7Z0JBQ3pELElBQUlELFFBQVFFLE1BQU0sSUFBSTtvQkFDcEJSLFlBQVlNLFFBQVFHLElBQUksR0FBR0MsSUFBSTtnQkFDakM7WUFDRixPQUFPO2dCQUNMWixlQUFlO2dCQUNmRSxZQUFZO1lBQ2Q7WUFDQUUsV0FBVztRQUNiO1FBRUEsT0FBT0U7SUFDVCxHQUFHLEVBQUU7SUFFTCx1QkFBdUI7SUFDdkIsTUFBTU8sZ0JBQWdCLE9BQU9DLEtBQUtDLE9BQU9DO1FBQ3ZDLElBQUk7WUFDRixNQUFNQyxpQkFBaUIsTUFBTWpDLDZFQUE4QkEsQ0FBQ1EsK0NBQUlBLEVBQUV1QixPQUFPQztZQUV6RSwwQ0FBMEM7WUFDMUMsTUFBTTFCLDBEQUFNQSxDQUFDRCx1REFBR0EsQ0FBQ0ksNkNBQUVBLEVBQUUsWUFBWXdCLGVBQWVWLElBQUksQ0FBQ0UsR0FBRyxHQUFHO2dCQUN6RE07Z0JBQ0FEO2dCQUNBRixNQUFNO2dCQUNOTSxXQUFXLElBQUlDO1lBQ2pCO1lBRUEsT0FBT0YsZUFBZVYsSUFBSTtRQUM1QixFQUFFLE9BQU9hLE9BQU87WUFDZCxNQUFNQTtRQUNSO0lBQ0Y7SUFFQSw0REFBNEQ7SUFDNUQsTUFBTUMsZ0JBQWdCLE9BQU9OLE9BQU9DLFVBQVVNO1FBQzVDLHVDQUF1QztRQUN2QyxJQUFJckIsYUFBYSxTQUFTO1lBQ3hCLE1BQU0sSUFBSXNCLE1BQU07UUFDbEI7UUFFQSxJQUFJO1lBQ0YsTUFBTU4saUJBQWlCLE1BQU1qQyw2RUFBOEJBLENBQUNRLCtDQUFJQSxFQUFFdUIsT0FBT0M7WUFFekUsMENBQTBDO1lBQzFDLE1BQU0xQiwwREFBTUEsQ0FBQ0QsdURBQUdBLENBQUNJLDZDQUFFQSxFQUFFLFlBQVl3QixlQUFlVixJQUFJLENBQUNFLEdBQUcsR0FBRztnQkFDekRNO2dCQUNBTztnQkFDQVYsTUFBTTtnQkFDTk0sV0FBVyxJQUFJQztZQUNqQjtZQUVBLE9BQU9GLGVBQWVWLElBQUk7UUFDNUIsRUFBRSxPQUFPYSxPQUFPO1lBQ2QsTUFBTUE7UUFDUjtJQUNGO0lBRUEsUUFBUTtJQUNSLE1BQU1JLFFBQVEsT0FBT1QsT0FBT0M7UUFDMUIsSUFBSTtZQUNGLE1BQU1DLGlCQUFpQixNQUFNaEMseUVBQTBCQSxDQUFDTywrQ0FBSUEsRUFBRXVCLE9BQU9DO1lBRXJFLDJDQUEyQztZQUMzQyxNQUFNUixVQUFVLE1BQU1qQiwwREFBTUEsQ0FBQ0YsdURBQUdBLENBQUNJLDZDQUFFQSxFQUFFLFlBQVl3QixlQUFlVixJQUFJLENBQUNFLEdBQUc7WUFDeEUsSUFBSUQsUUFBUUUsTUFBTSxJQUFJO2dCQUNwQixNQUFNRSxPQUFPSixRQUFRRyxJQUFJLEdBQUdDLElBQUk7Z0JBQ2hDUCxPQUFPb0IsSUFBSSxDQUFDYixTQUFTLFVBQVUscUJBQXFCO1lBQ3REO1lBRUEsT0FBT0ssZUFBZVYsSUFBSTtRQUM1QixFQUFFLE9BQU9hLE9BQU87WUFDZCxNQUFNQTtRQUNSO0lBQ0Y7SUFFQSxTQUFTO0lBQ1QsTUFBTU0sU0FBUztRQUNiLElBQUk7WUFDRixNQUFNeEMsc0RBQU9BLENBQUNNLCtDQUFJQTtZQUNsQmEsT0FBT29CLElBQUksQ0FBQztRQUNkLEVBQUUsT0FBT0wsT0FBTztZQUNkLE1BQU1BO1FBQ1I7SUFDRjtJQUVBLHVCQUF1QjtJQUN2QixNQUFNTyxnQkFBZ0IsT0FBT1o7UUFDM0IsSUFBSTtZQUNGLE1BQU01QixxRUFBc0JBLENBQUNLLCtDQUFJQSxFQUFFdUI7UUFDckMsRUFBRSxPQUFPSyxPQUFPO1lBQ2QsTUFBTUE7UUFDUjtJQUNGO0lBRUEsTUFBTVEsUUFBUTtRQUNaN0I7UUFDQUU7UUFDQVk7UUFDQVE7UUFDQUc7UUFDQUU7UUFDQUM7UUFDQXhCO0lBQ0Y7SUFFQSxxQkFDRSw4REFBQ1IsWUFBWWtDLFFBQVE7UUFBQ0QsT0FBT0E7a0JBQzFCLENBQUN6QixXQUFXTDs7Ozs7O0FBR25CLEVBQUUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hdmFsaWFjYW8tZmlzaWNhLWFwcC8uL3NyYy9jb250ZXh0cy9BdXRoQ29udGV4dC5qcz83ODc2Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUNvbnRleHQsIHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IFxyXG4gIGNyZWF0ZVVzZXJXaXRoRW1haWxBbmRQYXNzd29yZCwgXHJcbiAgc2lnbkluV2l0aEVtYWlsQW5kUGFzc3dvcmQsIFxyXG4gIHNpZ25PdXQsIFxyXG4gIHNlbmRQYXNzd29yZFJlc2V0RW1haWwsXHJcbiAgb25BdXRoU3RhdGVDaGFuZ2VkXHJcbn0gZnJvbSAnZmlyZWJhc2UvYXV0aCc7XHJcbmltcG9ydCB7IGRvYywgc2V0RG9jLCBnZXREb2MgfSBmcm9tICdmaXJlYmFzZS9maXJlc3RvcmUnO1xyXG5pbXBvcnQgeyBhdXRoLCBkYiB9IGZyb20gJy4uL2xpYi9maXJlYmFzZSc7XHJcbmltcG9ydCB7IHVzZVJvdXRlciB9IGZyb20gJ25leHQvcm91dGVyJztcclxuXHJcbmNvbnN0IEF1dGhDb250ZXh0ID0gY3JlYXRlQ29udGV4dCh7fSk7XHJcblxyXG5leHBvcnQgY29uc3QgdXNlQXV0aCA9ICgpID0+IHVzZUNvbnRleHQoQXV0aENvbnRleHQpO1xyXG5cclxuZXhwb3J0IGNvbnN0IEF1dGhQcm92aWRlciA9ICh7IGNoaWxkcmVuIH0pID0+IHtcclxuICBjb25zdCBbY3VycmVudFVzZXIsIHNldEN1cnJlbnRVc2VyXSA9IHVzZVN0YXRlKG51bGwpO1xyXG4gIGNvbnN0IFt1c2VyVHlwZSwgc2V0VXNlclR5cGVdID0gdXNlU3RhdGUobnVsbCk7IC8vICdhbHVubycgb3UgJ2FkbWluJ1xyXG4gIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpO1xyXG4gIGNvbnN0IHJvdXRlciA9IHVzZVJvdXRlcigpO1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgY29uc3QgdW5zdWJzY3JpYmUgPSBvbkF1dGhTdGF0ZUNoYW5nZWQoYXV0aCwgYXN5bmMgKHVzZXIpID0+IHtcclxuICAgICAgaWYgKHVzZXIpIHtcclxuICAgICAgICBzZXRDdXJyZW50VXNlcih1c2VyKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBWZXJpZmljYXIgc2UgbyB1c3XDoXJpbyDDqSBhZG1pbiBvdSBhbHVub1xyXG4gICAgICAgIGNvbnN0IHVzZXJEb2MgPSBhd2FpdCBnZXREb2MoZG9jKGRiLCAndXN1YXJpb3MnLCB1c2VyLnVpZCkpO1xyXG4gICAgICAgIGlmICh1c2VyRG9jLmV4aXN0cygpKSB7XHJcbiAgICAgICAgICBzZXRVc2VyVHlwZSh1c2VyRG9jLmRhdGEoKS50aXBvKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2V0Q3VycmVudFVzZXIobnVsbCk7XHJcbiAgICAgICAgc2V0VXNlclR5cGUobnVsbCk7XHJcbiAgICAgIH1cclxuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdW5zdWJzY3JpYmU7XHJcbiAgfSwgW10pO1xyXG5cclxuICAvLyBSZWdpc3RybyBwYXJhIGFsdW5vc1xyXG4gIGNvbnN0IHJlZ2lzdGVyQWx1bm8gPSBhc3luYyAoY3BmLCBlbWFpbCwgcGFzc3dvcmQpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHVzZXJDcmVkZW50aWFsID0gYXdhaXQgY3JlYXRlVXNlcldpdGhFbWFpbEFuZFBhc3N3b3JkKGF1dGgsIGVtYWlsLCBwYXNzd29yZCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBDcmlhciBkb2N1bWVudG8gZG8gdXN1w6FyaW8gbm8gRmlyZXN0b3JlXHJcbiAgICAgIGF3YWl0IHNldERvYyhkb2MoZGIsICd1c3VhcmlvcycsIHVzZXJDcmVkZW50aWFsLnVzZXIudWlkKSwge1xyXG4gICAgICAgIGVtYWlsLFxyXG4gICAgICAgIGNwZixcclxuICAgICAgICB0aXBvOiAnYWx1bm8nLFxyXG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIHJldHVybiB1c2VyQ3JlZGVudGlhbC51c2VyO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gUmVnaXN0cm8gcGFyYSBhZG1pbiAoYXBlbmFzIGFkbWluIHBvZGUgY3JpYXIgb3V0cm8gYWRtaW4pXHJcbiAgY29uc3QgcmVnaXN0ZXJBZG1pbiA9IGFzeW5jIChlbWFpbCwgcGFzc3dvcmQsIG5vbWUpID0+IHtcclxuICAgIC8vIFZlcmlmaWNhciBzZSBvIHVzdcOhcmlvIGF0dWFsIMOpIGFkbWluXHJcbiAgICBpZiAodXNlclR5cGUgIT09ICdhZG1pbicpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcGVuYXMgYWRtaW5pc3RyYWRvcmVzIHBvZGVtIGNyaWFyIG5vdm9zIGFkbWluaXN0cmFkb3JlcycpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCB1c2VyQ3JlZGVudGlhbCA9IGF3YWl0IGNyZWF0ZVVzZXJXaXRoRW1haWxBbmRQYXNzd29yZChhdXRoLCBlbWFpbCwgcGFzc3dvcmQpO1xyXG4gICAgICBcclxuICAgICAgLy8gQ3JpYXIgZG9jdW1lbnRvIGRvIHVzdcOhcmlvIG5vIEZpcmVzdG9yZVxyXG4gICAgICBhd2FpdCBzZXREb2MoZG9jKGRiLCAndXN1YXJpb3MnLCB1c2VyQ3JlZGVudGlhbC51c2VyLnVpZCksIHtcclxuICAgICAgICBlbWFpbCxcclxuICAgICAgICBub21lLFxyXG4gICAgICAgIHRpcG86ICdhZG1pbicsXHJcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpXHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgcmV0dXJuIHVzZXJDcmVkZW50aWFsLnVzZXI7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvLyBMb2dpblxyXG4gIGNvbnN0IGxvZ2luID0gYXN5bmMgKGVtYWlsLCBwYXNzd29yZCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgdXNlckNyZWRlbnRpYWwgPSBhd2FpdCBzaWduSW5XaXRoRW1haWxBbmRQYXNzd29yZChhdXRoLCBlbWFpbCwgcGFzc3dvcmQpO1xyXG4gICAgICBcclxuICAgICAgLy8gUmVkaXJlY2lvbmFyIGNvbSBiYXNlIG5vIHRpcG8gZGUgdXN1w6FyaW9cclxuICAgICAgY29uc3QgdXNlckRvYyA9IGF3YWl0IGdldERvYyhkb2MoZGIsICd1c3VhcmlvcycsIHVzZXJDcmVkZW50aWFsLnVzZXIudWlkKSk7XHJcbiAgICAgIGlmICh1c2VyRG9jLmV4aXN0cygpKSB7XHJcbiAgICAgICAgY29uc3QgdGlwbyA9IHVzZXJEb2MuZGF0YSgpLnRpcG87XHJcbiAgICAgICAgcm91dGVyLnB1c2godGlwbyA9PT0gJ2FkbWluJyA/ICcvYWRtaW4vZGFzaGJvYXJkJyA6ICcvYWx1bm8vZGFzaGJvYXJkJyk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIHJldHVybiB1c2VyQ3JlZGVudGlhbC51c2VyO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gTG9nb3V0XHJcbiAgY29uc3QgbG9nb3V0ID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgc2lnbk91dChhdXRoKTtcclxuICAgICAgcm91dGVyLnB1c2goJy8nKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIFJlY3VwZXJhw6fDo28gZGUgc2VuaGFcclxuICBjb25zdCByZXNldFBhc3N3b3JkID0gYXN5bmMgKGVtYWlsKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBzZW5kUGFzc3dvcmRSZXNldEVtYWlsKGF1dGgsIGVtYWlsKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHZhbHVlID0ge1xyXG4gICAgY3VycmVudFVzZXIsXHJcbiAgICB1c2VyVHlwZSxcclxuICAgIHJlZ2lzdGVyQWx1bm8sXHJcbiAgICByZWdpc3RlckFkbWluLFxyXG4gICAgbG9naW4sXHJcbiAgICBsb2dvdXQsXHJcbiAgICByZXNldFBhc3N3b3JkLFxyXG4gICAgbG9hZGluZ1xyXG4gIH07XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8QXV0aENvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3ZhbHVlfT5cclxuICAgICAgeyFsb2FkaW5nICYmIGNoaWxkcmVufVxyXG4gICAgPC9BdXRoQ29udGV4dC5Qcm92aWRlcj5cclxuICApO1xyXG59OyJdLCJuYW1lcyI6WyJjcmVhdGVDb250ZXh0IiwidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJ1c2VDb250ZXh0IiwiY3JlYXRlVXNlcldpdGhFbWFpbEFuZFBhc3N3b3JkIiwic2lnbkluV2l0aEVtYWlsQW5kUGFzc3dvcmQiLCJzaWduT3V0Iiwic2VuZFBhc3N3b3JkUmVzZXRFbWFpbCIsIm9uQXV0aFN0YXRlQ2hhbmdlZCIsImRvYyIsInNldERvYyIsImdldERvYyIsImF1dGgiLCJkYiIsInVzZVJvdXRlciIsIkF1dGhDb250ZXh0IiwidXNlQXV0aCIsIkF1dGhQcm92aWRlciIsImNoaWxkcmVuIiwiY3VycmVudFVzZXIiLCJzZXRDdXJyZW50VXNlciIsInVzZXJUeXBlIiwic2V0VXNlclR5cGUiLCJsb2FkaW5nIiwic2V0TG9hZGluZyIsInJvdXRlciIsInVuc3Vic2NyaWJlIiwidXNlciIsInVzZXJEb2MiLCJ1aWQiLCJleGlzdHMiLCJkYXRhIiwidGlwbyIsInJlZ2lzdGVyQWx1bm8iLCJjcGYiLCJlbWFpbCIsInBhc3N3b3JkIiwidXNlckNyZWRlbnRpYWwiLCJjcmVhdGVkQXQiLCJEYXRlIiwiZXJyb3IiLCJyZWdpc3RlckFkbWluIiwibm9tZSIsIkVycm9yIiwibG9naW4iLCJwdXNoIiwibG9nb3V0IiwicmVzZXRQYXNzd29yZCIsInZhbHVlIiwiUHJvdmlkZXIiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/contexts/AuthContext.js\n");

/***/ }),

/***/ "./src/lib/firebase.js":
/*!*****************************!*\
  !*** ./src/lib/firebase.js ***!
  \*****************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   auth: () => (/* binding */ auth),\n/* harmony export */   db: () => (/* binding */ db),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   storage: () => (/* binding */ storage)\n/* harmony export */ });\n/* harmony import */ var firebase_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase/app */ \"firebase/app\");\n/* harmony import */ var firebase_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! firebase/auth */ \"firebase/auth\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase/firestore */ \"firebase/firestore\");\n/* harmony import */ var firebase_storage__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! firebase/storage */ \"firebase/storage\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([firebase_app__WEBPACK_IMPORTED_MODULE_0__, firebase_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_firestore__WEBPACK_IMPORTED_MODULE_2__, firebase_storage__WEBPACK_IMPORTED_MODULE_3__]);\n([firebase_app__WEBPACK_IMPORTED_MODULE_0__, firebase_auth__WEBPACK_IMPORTED_MODULE_1__, firebase_firestore__WEBPACK_IMPORTED_MODULE_2__, firebase_storage__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n// Importações do Firebase\n\n\n\n\n// Configuração do Firebase\n// Substitua com suas credenciais do Firebase\nconst firebaseConfig = {\n    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,\n    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,\n    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,\n    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,\n    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,\n    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID\n};\n// Inicializar Firebase apenas uma vez\nlet firebaseApp;\nif (!(0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.getApps)().length) {\n    firebaseApp = (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.initializeApp)(firebaseConfig);\n} else {\n    firebaseApp = (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.getApps)()[0];\n}\n// Exportar instâncias do Firebase\nconst auth = (0,firebase_auth__WEBPACK_IMPORTED_MODULE_1__.getAuth)(firebaseApp);\nconst db = (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_2__.getFirestore)(firebaseApp);\nconst storage = (0,firebase_storage__WEBPACK_IMPORTED_MODULE_3__.getStorage)(firebaseApp);\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (firebaseApp);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbGliL2ZpcmViYXNlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTBCO0FBQzRCO0FBQ2Q7QUFDVTtBQUNKO0FBRTlDLDJCQUEyQjtBQUMzQiw2Q0FBNkM7QUFDN0MsTUFBTUssaUJBQWlCO0lBQ3JCQyxRQUFRQyxRQUFRQyxHQUFHLENBQUNDLDRCQUE0QjtJQUNoREMsWUFBWUgsUUFBUUMsR0FBRyxDQUFDRyxnQ0FBZ0M7SUFDeERDLFdBQVdMLFFBQVFDLEdBQUcsQ0FBQ0ssK0JBQStCO0lBQ3REQyxlQUFlUCxRQUFRQyxHQUFHLENBQUNPLG1DQUFtQztJQUM5REMsbUJBQW1CVCxRQUFRQyxHQUFHLENBQUNTLHdDQUF3QztJQUN2RUMsT0FBT1gsUUFBUUMsR0FBRyxDQUFDVywyQkFBMkI7QUFDaEQ7QUFFQSxzQ0FBc0M7QUFDdEMsSUFBSUM7QUFFSixJQUFJLENBQUNuQixxREFBT0EsR0FBR29CLE1BQU0sRUFBRTtJQUNyQkQsY0FBY3BCLDJEQUFhQSxDQUFDSztBQUM5QixPQUFPO0lBQ0xlLGNBQWNuQixxREFBT0EsRUFBRSxDQUFDLEVBQUU7QUFDNUI7QUFFQSxrQ0FBa0M7QUFDM0IsTUFBTXFCLE9BQU9wQixzREFBT0EsQ0FBQ2tCLGFBQWE7QUFDbEMsTUFBTUcsS0FBS3BCLGdFQUFZQSxDQUFDaUIsYUFBYTtBQUNyQyxNQUFNSSxVQUFVcEIsNERBQVVBLENBQUNnQixhQUFhO0FBQy9DLGlFQUFlQSxXQUFXQSxFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYXZhbGlhY2FvLWZpc2ljYS1hcHAvLi9zcmMvbGliL2ZpcmViYXNlLmpzPzFkZTAiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gSW1wb3J0YcOnw7VlcyBkbyBGaXJlYmFzZVxyXG5pbXBvcnQgeyBpbml0aWFsaXplQXBwLCBnZXRBcHBzIH0gZnJvbSAnZmlyZWJhc2UvYXBwJztcclxuaW1wb3J0IHsgZ2V0QXV0aCB9IGZyb20gJ2ZpcmViYXNlL2F1dGgnO1xyXG5pbXBvcnQgeyBnZXRGaXJlc3RvcmUgfSBmcm9tICdmaXJlYmFzZS9maXJlc3RvcmUnO1xyXG5pbXBvcnQgeyBnZXRTdG9yYWdlIH0gZnJvbSAnZmlyZWJhc2Uvc3RvcmFnZSc7XHJcblxyXG4vLyBDb25maWd1cmHDp8OjbyBkbyBGaXJlYmFzZVxyXG4vLyBTdWJzdGl0dWEgY29tIHN1YXMgY3JlZGVuY2lhaXMgZG8gRmlyZWJhc2VcclxuY29uc3QgZmlyZWJhc2VDb25maWcgPSB7XHJcbiAgYXBpS2V5OiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19GSVJFQkFTRV9BUElfS0VZLFxyXG4gIGF1dGhEb21haW46IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX0ZJUkVCQVNFX0FVVEhfRE9NQUlOLFxyXG4gIHByb2plY3RJZDogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfUFJPSkVDVF9JRCxcclxuICBzdG9yYWdlQnVja2V0OiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19GSVJFQkFTRV9TVE9SQUdFX0JVQ0tFVCxcclxuICBtZXNzYWdpbmdTZW5kZXJJZDogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfTUVTU0FHSU5HX1NFTkRFUl9JRCxcclxuICBhcHBJZDogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfQVBQX0lEXHJcbn07XHJcblxyXG4vLyBJbmljaWFsaXphciBGaXJlYmFzZSBhcGVuYXMgdW1hIHZlelxyXG5sZXQgZmlyZWJhc2VBcHA7XHJcblxyXG5pZiAoIWdldEFwcHMoKS5sZW5ndGgpIHtcclxuICBmaXJlYmFzZUFwcCA9IGluaXRpYWxpemVBcHAoZmlyZWJhc2VDb25maWcpO1xyXG59IGVsc2Uge1xyXG4gIGZpcmViYXNlQXBwID0gZ2V0QXBwcygpWzBdO1xyXG59XHJcblxyXG4vLyBFeHBvcnRhciBpbnN0w6JuY2lhcyBkbyBGaXJlYmFzZVxyXG5leHBvcnQgY29uc3QgYXV0aCA9IGdldEF1dGgoZmlyZWJhc2VBcHApO1xyXG5leHBvcnQgY29uc3QgZGIgPSBnZXRGaXJlc3RvcmUoZmlyZWJhc2VBcHApO1xyXG5leHBvcnQgY29uc3Qgc3RvcmFnZSA9IGdldFN0b3JhZ2UoZmlyZWJhc2VBcHApO1xyXG5leHBvcnQgZGVmYXVsdCBmaXJlYmFzZUFwcDsiXSwibmFtZXMiOlsiaW5pdGlhbGl6ZUFwcCIsImdldEFwcHMiLCJnZXRBdXRoIiwiZ2V0RmlyZXN0b3JlIiwiZ2V0U3RvcmFnZSIsImZpcmViYXNlQ29uZmlnIiwiYXBpS2V5IiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX0ZJUkVCQVNFX0FQSV9LRVkiLCJhdXRoRG9tYWluIiwiTkVYVF9QVUJMSUNfRklSRUJBU0VfQVVUSF9ET01BSU4iLCJwcm9qZWN0SWQiLCJORVhUX1BVQkxJQ19GSVJFQkFTRV9QUk9KRUNUX0lEIiwic3RvcmFnZUJ1Y2tldCIsIk5FWFRfUFVCTElDX0ZJUkVCQVNFX1NUT1JBR0VfQlVDS0VUIiwibWVzc2FnaW5nU2VuZGVySWQiLCJORVhUX1BVQkxJQ19GSVJFQkFTRV9NRVNTQUdJTkdfU0VOREVSX0lEIiwiYXBwSWQiLCJORVhUX1BVQkxJQ19GSVJFQkFTRV9BUFBfSUQiLCJmaXJlYmFzZUFwcCIsImxlbmd0aCIsImF1dGgiLCJkYiIsInN0b3JhZ2UiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/lib/firebase.js\n");

/***/ }),

/***/ "./src/pages/_app.js":
/*!***************************!*\
  !*** ./src/pages/_app.js ***!
  \***************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles/globals.css */ \"./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/head */ \"next/head\");\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _contexts_AuthContext__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../contexts/AuthContext */ \"./src/contexts/AuthContext.js\");\n/* harmony import */ var react_toastify__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react-toastify */ \"react-toastify\");\n/* harmony import */ var react_toastify_dist_ReactToastify_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react-toastify/dist/ReactToastify.css */ \"./node_modules/react-toastify/dist/ReactToastify.css\");\n/* harmony import */ var react_toastify_dist_ReactToastify_css__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_toastify_dist_ReactToastify_css__WEBPACK_IMPORTED_MODULE_5__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_contexts_AuthContext__WEBPACK_IMPORTED_MODULE_3__, react_toastify__WEBPACK_IMPORTED_MODULE_4__]);\n([_contexts_AuthContext__WEBPACK_IMPORTED_MODULE_3__, react_toastify__WEBPACK_IMPORTED_MODULE_4__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\n\n\nfunction MyApp({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_contexts_AuthContext__WEBPACK_IMPORTED_MODULE_3__.AuthProvider, {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_head__WEBPACK_IMPORTED_MODULE_2___default()), {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"title\", {\n                        children: \"Sistema de Avalia\\xe7\\xe3o F\\xedsica\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\EnokdaRocha\\\\OneDrive - ZIG Tecnologia S A\\\\\\xc1rea de Trabalho\\\\Projetos Pessoais\\\\breda\\\\avaliacao-fisica-app\\\\src\\\\pages\\\\_app.js\",\n                        lineNumber: 11,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"description\",\n                        content: \"Sistema de avalia\\xe7\\xe3o f\\xedsica para academias\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\EnokdaRocha\\\\OneDrive - ZIG Tecnologia S A\\\\\\xc1rea de Trabalho\\\\Projetos Pessoais\\\\breda\\\\avaliacao-fisica-app\\\\src\\\\pages\\\\_app.js\",\n                        lineNumber: 12,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"icon\",\n                        href: \"/favicon.ico\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\EnokdaRocha\\\\OneDrive - ZIG Tecnologia S A\\\\\\xc1rea de Trabalho\\\\Projetos Pessoais\\\\breda\\\\avaliacao-fisica-app\\\\src\\\\pages\\\\_app.js\",\n                        lineNumber: 13,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"viewport\",\n                        content: \"width=device-width, initial-scale=1.0\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\EnokdaRocha\\\\OneDrive - ZIG Tecnologia S A\\\\\\xc1rea de Trabalho\\\\Projetos Pessoais\\\\breda\\\\avaliacao-fisica-app\\\\src\\\\pages\\\\_app.js\",\n                        lineNumber: 14,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"C:\\\\Users\\\\EnokdaRocha\\\\OneDrive - ZIG Tecnologia S A\\\\\\xc1rea de Trabalho\\\\Projetos Pessoais\\\\breda\\\\avaliacao-fisica-app\\\\src\\\\pages\\\\_app.js\",\n                lineNumber: 10,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\EnokdaRocha\\\\OneDrive - ZIG Tecnologia S A\\\\\\xc1rea de Trabalho\\\\Projetos Pessoais\\\\breda\\\\avaliacao-fisica-app\\\\src\\\\pages\\\\_app.js\",\n                lineNumber: 16,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_toastify__WEBPACK_IMPORTED_MODULE_4__.ToastContainer, {\n                position: \"top-right\",\n                autoClose: 5000,\n                hideProgressBar: false,\n                newestOnTop: true,\n                closeOnClick: true,\n                rtl: false,\n                pauseOnFocusLoss: true,\n                draggable: true,\n                pauseOnHover: true\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\EnokdaRocha\\\\OneDrive - ZIG Tecnologia S A\\\\\\xc1rea de Trabalho\\\\Projetos Pessoais\\\\breda\\\\avaliacao-fisica-app\\\\src\\\\pages\\\\_app.js\",\n                lineNumber: 17,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\EnokdaRocha\\\\OneDrive - ZIG Tecnologia S A\\\\\\xc1rea de Trabalho\\\\Projetos Pessoais\\\\breda\\\\avaliacao-fisica-app\\\\src\\\\pages\\\\_app.js\",\n        lineNumber: 9,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvcGFnZXMvX2FwcC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBK0I7QUFDRjtBQUMwQjtBQUNQO0FBQ0Q7QUFFL0MsU0FBU0csTUFBTSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBRTtJQUNyQyxxQkFDRSw4REFBQ0osK0RBQVlBOzswQkFDWCw4REFBQ0Qsa0RBQUlBOztrQ0FDSCw4REFBQ007a0NBQU07Ozs7OztrQ0FDUCw4REFBQ0M7d0JBQUtDLE1BQUs7d0JBQWNDLFNBQVE7Ozs7OztrQ0FDakMsOERBQUNDO3dCQUFLQyxLQUFJO3dCQUFPQyxNQUFLOzs7Ozs7a0NBQ3RCLDhEQUFDTDt3QkFBS0MsTUFBSzt3QkFBV0MsU0FBUTs7Ozs7Ozs7Ozs7OzBCQUVoQyw4REFBQ0w7Z0JBQVcsR0FBR0MsU0FBUzs7Ozs7OzBCQUN4Qiw4REFBQ0gsMERBQWNBO2dCQUNiVyxVQUFTO2dCQUNUQyxXQUFXO2dCQUNYQyxpQkFBaUI7Z0JBQ2pCQyxXQUFXO2dCQUNYQyxZQUFZO2dCQUNaQyxLQUFLO2dCQUNMQyxnQkFBZ0I7Z0JBQ2hCQyxTQUFTO2dCQUNUQyxZQUFZOzs7Ozs7Ozs7Ozs7QUFJcEI7QUFFQSxpRUFBZWxCLEtBQUtBLEVBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hdmFsaWFjYW8tZmlzaWNhLWFwcC8uL3NyYy9wYWdlcy9fYXBwLmpzPzhmZGEiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuLi9zdHlsZXMvZ2xvYmFscy5jc3MnO1xyXG5pbXBvcnQgSGVhZCBmcm9tICduZXh0L2hlYWQnO1xyXG5pbXBvcnQgeyBBdXRoUHJvdmlkZXIgfSBmcm9tICcuLi9jb250ZXh0cy9BdXRoQ29udGV4dCc7XHJcbmltcG9ydCB7IFRvYXN0Q29udGFpbmVyIH0gZnJvbSAncmVhY3QtdG9hc3RpZnknO1xyXG5pbXBvcnQgJ3JlYWN0LXRvYXN0aWZ5L2Rpc3QvUmVhY3RUb2FzdGlmeS5jc3MnO1xyXG5cclxuZnVuY3Rpb24gTXlBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9KSB7XHJcbiAgcmV0dXJuIChcclxuICAgIDxBdXRoUHJvdmlkZXI+XHJcbiAgICAgIDxIZWFkPlxyXG4gICAgICAgIDx0aXRsZT5TaXN0ZW1hIGRlIEF2YWxpYcOnw6NvIEbDrXNpY2E8L3RpdGxlPlxyXG4gICAgICAgIDxtZXRhIG5hbWU9XCJkZXNjcmlwdGlvblwiIGNvbnRlbnQ9XCJTaXN0ZW1hIGRlIGF2YWxpYcOnw6NvIGbDrXNpY2EgcGFyYSBhY2FkZW1pYXNcIiAvPlxyXG4gICAgICAgIDxsaW5rIHJlbD1cImljb25cIiBocmVmPVwiL2Zhdmljb24uaWNvXCIgLz5cclxuICAgICAgICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMFwiIC8+XHJcbiAgICAgIDwvSGVhZD5cclxuICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxyXG4gICAgICA8VG9hc3RDb250YWluZXIgXHJcbiAgICAgICAgcG9zaXRpb249XCJ0b3AtcmlnaHRcIlxyXG4gICAgICAgIGF1dG9DbG9zZT17NTAwMH1cclxuICAgICAgICBoaWRlUHJvZ3Jlc3NCYXI9e2ZhbHNlfVxyXG4gICAgICAgIG5ld2VzdE9uVG9wXHJcbiAgICAgICAgY2xvc2VPbkNsaWNrXHJcbiAgICAgICAgcnRsPXtmYWxzZX1cclxuICAgICAgICBwYXVzZU9uRm9jdXNMb3NzXHJcbiAgICAgICAgZHJhZ2dhYmxlXHJcbiAgICAgICAgcGF1c2VPbkhvdmVyXHJcbiAgICAgIC8+XHJcbiAgICA8L0F1dGhQcm92aWRlcj5cclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBNeUFwcDsiXSwibmFtZXMiOlsiSGVhZCIsIkF1dGhQcm92aWRlciIsIlRvYXN0Q29udGFpbmVyIiwiTXlBcHAiLCJDb21wb25lbnQiLCJwYWdlUHJvcHMiLCJ0aXRsZSIsIm1ldGEiLCJuYW1lIiwiY29udGVudCIsImxpbmsiLCJyZWwiLCJocmVmIiwicG9zaXRpb24iLCJhdXRvQ2xvc2UiLCJoaWRlUHJvZ3Jlc3NCYXIiLCJuZXdlc3RPblRvcCIsImNsb3NlT25DbGljayIsInJ0bCIsInBhdXNlT25Gb2N1c0xvc3MiLCJkcmFnZ2FibGUiLCJwYXVzZU9uSG92ZXIiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/pages/_app.js\n");

/***/ }),

/***/ "./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ (() => {



/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "next/head":
/*!****************************!*\
  !*** external "next/head" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/head");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "firebase/app":
/*!*******************************!*\
  !*** external "firebase/app" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/app");;

/***/ }),

/***/ "firebase/auth":
/*!********************************!*\
  !*** external "firebase/auth" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/auth");;

/***/ }),

/***/ "firebase/firestore":
/*!*************************************!*\
  !*** external "firebase/firestore" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/firestore");;

/***/ }),

/***/ "firebase/storage":
/*!***********************************!*\
  !*** external "firebase/storage" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = import("firebase/storage");;

/***/ }),

/***/ "react-toastify":
/*!*********************************!*\
  !*** external "react-toastify" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = import("react-toastify");;

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc","vendor-chunks/react-toastify"], () => (__webpack_exec__("./src/pages/_app.js")));
module.exports = __webpack_exports__;

})();