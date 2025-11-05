import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import Login from '../views/Login.vue';
import Welcome from '../views/Welcome.vue';
import Objects from '../views/Objects.vue';
import Reservations from '../views/Reservations.vue';
import AdminObjects from '../views/AdminObjects.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: Welcome,
    meta: { requiresAuth: true }
  },
  {
    path: '/objects',
    name: 'Objects',
    component: Objects,
    meta: { requiresAuth: true }
  },
  {
    path: '/reservations',
    name: 'Reservations',
    component: Reservations,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/objects',
    name: 'AdminObjects',
    component: AdminObjects,
    meta: { requiresAuth: true, roles: ['admin', 'manager'] }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !token) {
    next('/login');
    return;
  }
  
  // Check role-based access
  if (to.meta.roles && userStr) {
    try {
      const user = JSON.parse(userStr);
      const requiredRoles = to.meta.roles as string[];
      
      if (!requiredRoles.includes(user.role)) {
        // Redirect to welcome if user doesn't have required role
        next('/welcome');
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      next('/welcome');
      return;
    }
  }
  
  // Handle login redirect
  if (to.path === '/login' && token) {
    next('/welcome');
  } else {
    next();
  }
});

export default router;
