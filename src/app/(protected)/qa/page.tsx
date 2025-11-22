
"use client"
import React, { Fragment, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import useProject from '~/hooks/use-project'
import { api } from '~/trpc/react';
import AskQuestionCard from '../dashboard/ask-question-card';
import MarkdownPreview from '@uiw/react-markdown-preview';
import CodeRefrence from '../dashboard/code-refrence';
import { useTheme } from 'next-themes';

const QAPage = () => {
  const { projectId } = useProject();
  const { data: questions, isLoading, error } = api.project.getQuestions.useQuery(
    { projectId }, 
    { 
      enabled: !!projectId // Only fetch if projectId exists
    }
  );
  const { theme } = useTheme()
  const [questionIndex, setQuestionIndex] = useState(0);
  
  // Safe access to question with fallback
  const question = questions?.[questionIndex];

  return (
    <Sheet>
      <AskQuestionCard />
      <div className='h-4'></div>
      
      <h1 className='text-xl font-semibold'>Saved Questions</h1>
      <div className="h-2"></div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading questions...</span>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="text-red-500 p-4 border border-red-200 rounded-md">
          Error loading questions: {error.message}
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && !error && (!questions || questions.length === 0) && (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No saved questions yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Ask a question above and save it to see it here!
          </p>
        </div>
      )}
      
      {/* Questions List */}
      {!isLoading && questions && questions.length > 0 && (
        <div className="flex flex-col gap-2">
          {questions.map((q, index) => (
            <Fragment key={q.id}>
              <SheetTrigger onClick={() => setQuestionIndex(index)}>
                <div className='flex items-center gap-4 rounded-lg p-4 shadow border hover:bg-accent transition-colors cursor-pointer'>
                  <img 
                    className='rounded-full' 
                    height={30} 
                    width={30} 
                    src={q.user.imageUrl ?? ""} 
                    alt={q.user.firstName ?? "User"}
                  />
                  <div className='text-left flex flex-col flex-1'>
                    <div className='flex items-center justify-between'>
                      <p className='line-clamp-1 text-lg font-medium'>
                        {q.question}
                      </p>
                      <span className='text-sm text-gray-400 whitespace-nowrap ml-4'>
                        {q.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className='text-gray-500 line-clamp-1 text-sm'>
                      {q.answer}
                    </p>
                  </div>
                </div>
              </SheetTrigger>
            </Fragment>
          ))}
        </div>
      )}

      {/* Question Detail Sheet */}
      {question && (
        <SheetContent className='sm:max-w-[80vw] overflow-y-auto'>
          <SheetHeader>
            <SheetTitle className="text-left">
              {question.question}
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-4 space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img 
                className='rounded-full' 
                height={24} 
                width={24} 
                src={question.user.imageUrl ?? ""} 
                alt={question.user.firstName ?? "User"}
              />
              <span>
                {question.user.firstName} {question.user.lastName}
              </span>
              <span>•</span>
              <span>{question.createdAt.toLocaleString()}</span>
            </div>
            
            {/* Answer */}
            <div className="prose dark:prose-invert max-w-none">
              <MarkdownPreview 
                source={question.answer} 
                style={{ padding: '1rem', background: 'transparent' }} 
                wrapperElement={{
                  "data-color-mode": theme === 'dark' ? 'dark' : 'light',
                }}
              />
            </div>
            
            {/* Code References */}
            {question.filesRefrences && Array.isArray(question.filesRefrences) && (question.filesRefrences as any[]).length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">
                  Referenced Files ({(question.filesRefrences as any[]).length})
                </h3>
                <CodeRefrence filesRefrences={question.filesRefrences as any} />
              </div>
            )}
          </div>
        </SheetContent>
      )}
    </Sheet>
  )
}

export default QAPage