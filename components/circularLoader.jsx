import React from 'react'

const CircularLoader = ({ label = 'Loading…' }) => {
    return (
        <div role="status" className='flex items-center justify-center gap-3 text-muted-foreground'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary' aria-hidden="true"></div>
            <span className='text-sm'>{label}</span>
        </div>
    )
}

export default CircularLoader
