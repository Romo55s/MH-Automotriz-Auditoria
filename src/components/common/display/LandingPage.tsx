import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Clock,
  Cloud,
  Download,
  FileText,
  Play,
  QrCode,
  Shield,
  Smartphone,
  Users,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { VideoModal } from '../modals';

const LandingPage: React.FC = () => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  // Floating animation for 3D elements
  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  // Fade in animation
  const fadeInVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    }
  };

  // Stagger animation for features
  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/IMG_3801.webp)'
          }}
        ></div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-400/10 to-transparent"></div>
        
        {/* Floating 3D Elements */}
        <motion.div 
          className="absolute top-20 left-4 sm:left-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20 blur-xl"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div 
          className="absolute top-40 right-4 sm:right-20 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full opacity-15 blur-2xl"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '1s' }}
        />
        <motion.div 
          className="absolute bottom-40 left-1/4 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20 blur-xl"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
        />

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo */}
            <div className="mb-6 sm:mb-8 flex justify-center">
              <img 
                src="/MH Automotriz-White.png" 
                alt="MH Automotriz" 
                className="h-12 sm:h-16"
              />
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold uppercase tracking-wider mb-4 sm:mb-6 leading-tight">
              Sistema de
              <br />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Inventario
              </span>
              <br />
              Automotriz
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              Herramienta interna para optimizar la gestión de inventarios en todas nuestras agencias
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-all duration-300 w-full sm:w-auto"
                onClick={() => window.location.href = '/login'}
              >
                Iniciar Sesión
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto"
                onClick={() => setIsVideoModalOpen(true)}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Ver Demo
              </motion.button>
            </div>

            {/* Stats */}
            <motion.div 
              className="flex flex-row justify-center items-center gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto px-4"
              variants={staggerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={featureVariants} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">2x</div>
                <div className="text-gray-300 text-sm sm:text-base">Más Eficiente</div>
              </motion.div>
              <motion.div variants={featureVariants} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-orange-400 mb-2">100%</div>
                <div className="text-gray-300 text-sm sm:text-base">Tiempo Real</div>
              </motion.div>
              <motion.div variants={featureVariants} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">1</div>
                <div className="text-gray-300 text-sm sm:text-base">Ubicación</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-wider mb-4 sm:mb-6">
              Características
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Principales
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Tecnología de vanguardia para una gestión de inventarios sin precedentes
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            variants={staggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Feature 1 */}
            <motion.div variants={featureVariants}>
              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-row items-start gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <div className="flex flex-col flex-grow">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-left">Escaneo QR Avanzado</h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base text-left flex-grow">
                    Captura datos completos del vehículo (Serie, Marca, Color, Ubicación) 
                    con tecnología QR de última generación
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={featureVariants}>
              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-row items-start gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <div className="flex flex-col flex-grow">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-left">Colaboración Tiempo Real</h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base text-left flex-grow">
                    Múltiples usuarios trabajando simultáneamente con sincronización 
                    instantánea y notificaciones inteligentes
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={featureVariants}>
              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-row items-start gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <div className="flex flex-col flex-grow">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-left">Múltiples Inventarios</h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base text-left flex-grow">
                    Hasta 2 inventarios por mes por agencia con gestión independiente 
                    y reseteo automático mensual
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={featureVariants}>
              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-row items-start gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <div className="flex flex-col flex-grow">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-left">Interfaz Inteligente</h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base text-left flex-grow">
                    Botones dinámicos que cambian según el estado del inventario 
                    para una experiencia de usuario optimizada
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 5 */}
            <motion.div variants={featureVariants}>
              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-row items-start gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Cloud className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <div className="flex flex-col flex-grow">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-left">Integración Google Drive</h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base text-left flex-grow">
                    Respaldo automático con retención de 30 días y sincronización 
                    en la nube para máxima seguridad
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 6 */}
            <motion.div variants={featureVariants}>
              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-row items-start gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <div className="flex flex-col flex-grow">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-left">Reseteo Automático</h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base text-left flex-grow">
                    Contadores se reinician automáticamente cada mes con detección 
                    inteligente de cambios de período
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* System in Action Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-wider mb-4 sm:mb-6">
              Sistema en
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Acción
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
              Funcionalidades clave que optimizan el trabajo diario de nuestras agencias
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            variants={staggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Escaneo Instantáneo</h4>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base flex-grow">Captura inmediata de datos del vehículo con tecnología QR avanzada</p>
              </div>
            </motion.div>

            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Trabajo Colaborativo</h4>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base flex-grow">Múltiples usuarios trabajando simultáneamente con sincronización en tiempo real</p>
              </div>
            </motion.div>

            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Gestión Inteligente</h4>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base flex-grow">Control automático de inventarios mensuales por agencia</p>
              </div>
            </motion.div>

            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Acceso Móvil</h4>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base flex-grow">Funcionalidad completa disponible en cualquier dispositivo móvil</p>
              </div>
            </motion.div>

            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Cloud className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Respaldo Automático</h4>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base flex-grow">Datos seguros con respaldo automático en Google Drive</p>
              </div>
            </motion.div>

            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 h-64 sm:h-72 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Automatización</h4>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base flex-grow">Reseteo automático mensual y gestión inteligente de períodos</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-wider mb-4 sm:mb-6">
              Tutorial del
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Sistema
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
              Aprende a usar el sistema con esta guía completa para personal de agencias
            </p>

            <motion.div 
              className="relative group cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsVideoModalOpen(true)}
            >
              <div className="relative bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl sm:rounded-3xl p-1 sm:p-2">
                <div className="bg-black rounded-xl sm:rounded-2xl p-8 sm:p-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-black ml-1" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Tutorial Completo</h3>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Haz clic para ver la guía paso a paso del sistema
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-wider mb-4 sm:mb-6">
              Beneficios
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Clave
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Ventajas competitivas que transforman tu gestión de inventarios
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
            variants={staggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 sm:p-6 text-center hover:border-yellow-400/50 transition-all duration-300 h-48 sm:h-52 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-2">Ahorro de Tiempo</h4>
                <p className="text-gray-300 text-sm sm:text-base flex-grow">Reduce 70% el tiempo de inventario</p>
              </div>
            </motion.div>

            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 sm:p-6 text-center hover:border-yellow-400/50 transition-all duration-300 h-48 sm:h-52 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-2">Máxima Seguridad</h4>
                <p className="text-gray-300 text-sm sm:text-base flex-grow">Datos protegidos y respaldados</p>
              </div>
            </motion.div>

            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 sm:p-6 text-center hover:border-yellow-400/50 transition-all duration-300 h-48 sm:h-52 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Download className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-2">Exportación Fácil</h4>
                <p className="text-gray-300 text-sm sm:text-base flex-grow">Reportes en Excel y CSV</p>
              </div>
            </motion.div>

            <motion.div variants={featureVariants}>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 sm:p-6 text-center hover:border-yellow-400/50 transition-all duration-300 h-48 sm:h-52 flex flex-col">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-2">Trazabilidad Total</h4>
                <p className="text-gray-300 text-sm sm:text-base flex-grow">Historial completo de cambios</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-wider mb-4 sm:mb-6">
              Acceso al
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Sistema
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Inicia sesión para acceder al sistema de inventario de tu agencia
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-8 sm:px-12 py-4 sm:py-6 rounded-full font-bold text-lg sm:text-xl flex items-center gap-3 sm:gap-4 mx-auto hover:shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300"
              onClick={() => window.location.href = '/login'}
            >
              Acceder al Sistema
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <img 
            src="/MH Automotriz-White.png" 
            alt="MH Automotriz" 
            className="h-8 sm:h-12 mx-auto mb-4 sm:mb-6"
          />
          <p className="text-gray-400 text-sm sm:text-base">
            © 2025 MH Automotriz. Sistema de Inventario Automotriz v2.0
          </p>
        </div>
      </footer>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title="Demo del Sistema de Inventario Automotriz"
        videoUrl="https://player.vimeo.com/video/1129418761"
      />
    </div>
  );
};

export default LandingPage;
