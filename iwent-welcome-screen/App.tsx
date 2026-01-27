
import React, { useState } from 'react';
import { Slideshow } from './components/Slideshow';
import { StatusBar } from './components/StatusBar';
import { SlotAnimation } from './components/SlotAnimation';
import { SignUp } from './components/SignUp';
import { EmailSignUp } from './components/EmailSignUp';
import { Login } from './components/Login';
import { Home } from './components/Home';

export type Language = 'TR' | 'EN';
type Screen = 'welcome' | 'signup' | 'email-signup' | 'login' | 'home';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [language, setLanguage] = useState<Language>('TR');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <main className="flex-1 flex flex-col justify-end items-center px-6 pb-16 w-full max-sm mx-auto h-full animate-in fade-in duration-700">
            <div className="flex-1 flex flex-col justify-center items-center w-full mt-24">
              <h1 className="text-6xl font-serif font-bold text-center text-white leading-[1.35] tracking-tight drop-shadow-2xl flex flex-row items-center justify-center gap-4">
                <span>{language === 'TR' ? 'Anı' : 'Live'}</span>
                <SlotAnimation language={language} />
              </h1>
            </div>

            <div className="w-full space-y-4 mb-8">
              <button 
                onClick={() => setCurrentScreen('signup')}
                type="button"
                className="w-full bg-primary hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-black font-extrabold text-[17px] py-[20px] px-6 rounded-xl shadow-[0_4px_24px_rgba(0,230,118,0.3)]"
              >
                {language === 'TR' ? 'Kayıt Ol' : 'Sign Up'}
              </button>
              <button 
                onClick={() => setCurrentScreen('login')}
                type="button"
                className="w-full bg-transparent border-[2.5px] border-primary text-primary hover:bg-primary/10 active:scale-[0.98] transition-all duration-200 font-extrabold text-[17px] py-[18px] px-6 rounded-xl backdrop-blur-md"
              >
                {language === 'TR' ? 'Giriş Yap' : 'Login'}
              </button>
            </div>
          </main>
        );
      case 'signup':
        return (
          <SignUp 
            language={language}
            onBack={() => setCurrentScreen('welcome')} 
            onEmailSignUp={() => setCurrentScreen('email-signup')}
            onLogin={() => setCurrentScreen('login')}
          />
        );
      case 'email-signup':
        return (
          <EmailSignUp 
            language={language}
            onBack={() => setCurrentScreen('signup')} 
            onLogin={() => setCurrentScreen('login')}
            onSignUpSuccess={() => setCurrentScreen('home')}
          />
        );
      case 'login':
        return (
          <Login 
            language={language}
            onBack={() => setCurrentScreen('welcome')} 
            onSignUp={() => setCurrentScreen('signup')} 
            onLoginSuccess={() => setCurrentScreen('home')}
          />
        );
      case 'home':
        return <Home language={language} setLanguage={setLanguage} onLogout={() => setCurrentScreen('welcome')} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col selection:bg-primary selection:text-black antialiased bg-black">
      {currentScreen === 'welcome' && <Slideshow />}
      
      <div className="absolute inset-0 z-10 bg-black/40 transition-colors duration-700"></div>
      <div className="absolute inset-0 z-10 gradient-overlay pointer-events-none"></div>
      {currentScreen !== 'home' && <StatusBar />}
      <div className="relative z-20 flex-1 flex flex-col w-full h-full overflow-y-auto custom-scrollbar">
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;
