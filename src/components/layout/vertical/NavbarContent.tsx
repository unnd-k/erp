'use client'

// Third-party Imports
import classnames from 'classnames'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import IconButton from '@mui/material/IconButton'

// Component Imports
import NavToggle from './NavToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'



const NavbarContent = () => {
  const params = useParams()
  const locale = params?.lang || 'en'

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-[7px]'>
        <NavToggle />
      </div>
      <div className='flex items-center gap-2'>
        <IconButton component={Link} href={`/${locale}/apps/project?new=true`} color='inherit' size='small'>
          <i className='ri-folder-add-line' style={{ fontSize: 24 }} />
        </IconButton>
        <ModeDropdown />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
