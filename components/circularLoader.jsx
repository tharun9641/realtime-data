import React from 'react'

const CircularLoader = () => {
    return (
        <section className='flex items-center justify-center gap-4'>
            <div className='w-20 h-20 border-10 border-white border-l-gray-400 rounded-full animate-spin'></div>
            <h3>Loading...</h3>
        </section>
    )
}

export default CircularLoader