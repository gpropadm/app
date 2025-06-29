import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 UPDATE TEST: Starting...')
    
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, companyId: user.companyId })
    
    // Find first owner to test update
    const firstOwner = await prisma.owner.findFirst({
      where: { companyId: user.companyId }
    })
    
    if (!firstOwner) {
      return NextResponse.json({ error: 'Nenhum proprietário encontrado' }, { status: 404 })
    }
    
    console.log('👤 Testing update for owner:', firstOwner.id, firstOwner.name)
    
    // Test simple update without bank account
    const updateData = {
      name: firstOwner.name + ' (TESTE UPDATE)',
      email: firstOwner.email,
      phone: firstOwner.phone,
      document: firstOwner.document,
      address: firstOwner.address || '',
      city: firstOwner.city || '',
      state: firstOwner.state || '',
      zipCode: firstOwner.zipCode || ''
    }
    
    console.log('📝 Updating with data:', updateData)
    
    // Direct update without includes
    const updatedOwner = await prisma.owner.update({
      where: { id: firstOwner.id },
      data: updateData
    })
    
    console.log('✅ Update successful:', updatedOwner.id)
    
    // Revert the name change
    await prisma.owner.update({
      where: { id: firstOwner.id },
      data: { name: firstOwner.name }
    })
    
    console.log('🔄 Name reverted')
    
    return NextResponse.json({
      success: true,
      message: 'Teste de atualização executado com sucesso',
      updatedOwner: {
        id: updatedOwner.id,
        name: updatedOwner.name,
        email: updatedOwner.email
      }
    })
    
  } catch (error) {
    console.error('❌ UPDATE TEST Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste de atualização',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
    }, { status: 500 })
  }
}